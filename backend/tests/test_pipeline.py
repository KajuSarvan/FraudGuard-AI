import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.invoice import Invoice
from app.agents.orchestrator import FraudGuardOrchestrator

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_healthcheck():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert len(data["agents"]) == 4


def test_preset_invoice_creation():
    response = client.post("/api/invoices/preset", json={"preset_type": "clean"})
    assert response.status_code == 200
    invoice = response.json()
    assert invoice["vendor_name"] == "Apex Cloud Infrastructure Inc"
    assert invoice["status"] == "PENDING"


def test_duplicate_preset_invoice_creation():
    response = client.post("/api/invoices/preset", json={"preset_type": "duplicate"})
    assert response.status_code == 200
    invoice = response.json()
    assert invoice["invoice_number"] == "INV-DUP-9901"


def test_full_agent_pipeline_execution_sync():
    # 1. Create a preset invoice in DB
    db = SessionLocal()
    preset_invoice = Invoice(
        filename="test_suspicious.json",
        vendor_name="Testing Vendor Ltd",
        invoice_number="INV-TEST-001",
        invoice_date="2026-08-05",
        due_date="2026-08-06",
        total_amount=55000.0,
        currency="USD",
        status="PENDING",
        raw_content='{"vendor_name": "Testing Vendor Ltd", "invoice_number": "INV-TEST-001", "total_amount": 55000.0}',
    )
    db.add(preset_invoice)
    db.commit()
    db.refresh(preset_invoice)

    # 2. Run pipeline via orchestrator in event loop
    async def run():
        orchestrator = FraudGuardOrchestrator()
        traces = []
        async for event_str in orchestrator.run_pipeline(preset_invoice.id, db):
            traces.append(event_str)
        return traces

    traces = asyncio.run(run())
    assert len(traces) > 5  # Multiple steps emitted across 4 agents

    # Refresh invoice record
    db.refresh(preset_invoice)
    assert preset_invoice.status in ["APPROVE", "ESCALATE", "REJECT"]
    assert preset_invoice.risk_score > 0.0
    assert preset_invoice.verdict_summary is not None
    assert preset_invoice.critic_notes is not None
    db.close()
