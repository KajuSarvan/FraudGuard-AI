import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.seed import seed_database
from app.database import SessionLocal, get_db
from app.models import Invoice, Vendor, PurchaseOrder, GoodsReceipt, PaymentLedger

client = TestClient(app)


def get_auth_header(email: str = "demo@fraudguard.ai", password: str = "demo1234"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def reset_db_before_each():
    seed_database()
    yield


def test_demo_reset_restores_deterministic_state():
    headers = get_auth_header("demo@fraudguard.ai")

    # 1. Fetch initial state
    res_invoices = client.get("/api/invoices", headers=headers)
    assert res_invoices.status_code == 200
    initial_invoices = res_invoices.json()
    assert len(initial_invoices) == 13

    res_metrics = client.get("/api/dashboard/metrics", headers=headers)
    assert res_metrics.status_code == 200
    initial_metrics = res_metrics.json()

    # 2. Mutate state by adding custom preset invoices
    client.post("/api/invoices/preset", json={"preset_type": "clean"}, headers=headers)
    client.post("/api/invoices/preset", json={"preset_type": "duplicate"}, headers=headers)

    res_after_mutate = client.get("/api/invoices", headers=headers)
    assert len(res_after_mutate.json()) == 15

    # 3. Call Reset Demo State API
    res_reset = client.post("/api/demo/reset", headers=headers)
    assert res_reset.status_code == 200
    assert res_reset.json()["message"] == "Demo state reset successfully."

    # 4. Confirm state returns to exact initial values
    res_after_reset = client.get("/api/invoices", headers=headers)
    assert len(res_after_reset.json()) == 13

    res_metrics_after = client.get("/api/dashboard/metrics", headers=headers)
    assert res_metrics_after.json()["transactions_protected"] == initial_metrics["transactions_protected"]


def test_repeated_demo_resets():
    headers = get_auth_header("demo@fraudguard.ai")
    for _ in range(3):
        res = client.post("/api/demo/reset", headers=headers)
        assert res.status_code == 200
        invoices = client.get("/api/invoices", headers=headers).json()
        assert len(invoices) == 13


def test_clean_supplier_scenario_approves_after_reset():
    headers = get_auth_header("demo@fraudguard.ai")
    client.post("/api/demo/reset", headers=headers)

    # Submit Clean Supplier Preset
    preset_res = client.post("/api/invoices/preset", json={"preset_type": "clean"}, headers=headers)
    assert preset_res.status_code == 200
    created_inv = preset_res.json()

    # Analyze invoice synchronously
    analyze_res = client.post(
        "/api/analyze",
        json={"invoice_text": created_inv["reasoning"], "invoice_id": created_inv["id"]},
        headers=headers
    )
    assert analyze_res.status_code == 200
    data = analyze_res.json()
    verdict = data.get("final_verdict") or data.get("final_decision", {}).get("verdict") or data.get("final_decision", {}).get("action")
    assert verdict in ["APPROVE", "APPROVED"]


def test_repeated_clean_suppliers_generate_unique_ids():
    headers = get_auth_header("demo@fraudguard.ai")
    client.post("/api/demo/reset", headers=headers)

    # Clean Supplier 1
    p1 = client.post("/api/invoices/preset", json={"preset_type": "clean"}, headers=headers).json()
    # Clean Supplier 2
    p2 = client.post("/api/invoices/preset", json={"preset_type": "clean"}, headers=headers).json()

    assert p1["invoice_number"] != p2["invoice_number"], "Clean suppliers must use distinct non-colliding invoice numbers"


def test_duplicate_attack_detected_and_rejected():
    headers = get_auth_header("demo@fraudguard.ai")
    client.post("/api/demo/reset", headers=headers)

    # Submit Duplicate Invoice Attack Preset
    dup_res = client.post("/api/invoices/preset", json={"preset_type": "duplicate"}, headers=headers)
    assert dup_res.status_code == 200
    created_inv = dup_res.json()

    analyze_res = client.post(
        "/api/analyze",
        json={"invoice_text": created_inv["reasoning"], "invoice_id": created_inv["id"]},
        headers=headers
    )
    assert analyze_res.status_code == 200
    data = analyze_res.json()

    verdict = data.get("final_verdict") or data.get("final_decision", {}).get("verdict") or data.get("final_decision", {}).get("action")
    risk_flags = data.get("risk_signals") or data.get("final_decision", {}).get("risk_signals", [])

    assert verdict in ["REJECT", "REJECTED", "HOLD"]
    flag_names = [f if isinstance(f, str) else f.get("rule") for f in risk_flags]
    assert any("DUPLICATE" in flag for flag in flag_names)




def test_database_persistence_across_reloads():
    db = SessionLocal()
    try:
        # Query total vendors from DB directly
        count_before = db.query(Vendor).count()
        assert count_before == 10
    finally:
        db.close()

    # Re-open session and verify persistence
    db2 = SessionLocal()
    try:
        count_after = db2.query(Vendor).count()
        assert count_after == 10
    finally:
        db2.close()


def test_tenant_isolation_during_reset():
    headers_a = get_auth_header("demo@fraudguard.ai")
    headers_b = get_auth_header("demo2@fraudguard.ai")

    # User B should have 2 initial invoices
    invoices_b_before = client.get("/api/invoices", headers=headers_b).json()
    assert len(invoices_b_before) == 2

    # User A triggers reset
    client.post("/api/demo/reset", headers=headers_a)

    # User B state must remain correctly scoped
    invoices_b_after = client.get("/api/invoices", headers=headers_b).json()
    assert len(invoices_b_after) == 2


def test_unauthorized_reset_attempt_returns_401():
    res = client.post("/api/demo/reset")
    assert res.status_code == 401


def test_reset_disabled_configuration_returns_403(monkeypatch):
    monkeypatch.setenv("ENABLE_DEMO_RESET", "false")
    headers = get_auth_header("demo@fraudguard.ai")

    res = client.post("/api/demo/reset", headers=headers)
    assert res.status_code == 403
    assert "disabled" in res.json()["detail"].lower()


def test_system_database_activity_endpoint():
    headers = get_auth_header("demo@fraudguard.ai")
    res = client.get("/api/system/database-activity", headers=headers)

    assert res.status_code == 200
    payload = res.json()
    assert "counters" in payload
    assert "recent_invoices" in payload
    assert "recent_ledger_records" in payload
    assert payload["counters"]["total_vendors"] == 10
    assert payload["counters"]["total_invoices"] == 13
    assert "effective_database_path" in payload
