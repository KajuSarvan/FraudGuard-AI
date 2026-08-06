from .database import engine, Base, SessionLocal
from .models import Vendor, Invoice, User


def seed_database():
    # Re-create tables cleanly
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed 8 Realistic Vendors
        vendors_data = [
            {
                "name": "Apex Cloud Infrastructure Inc",
                "tax_id": "US-EIN-98421049",
                "avg_invoice_amount": 1450.00,
                "first_seen_date": "2025-01-15",
                "is_known": True,
            },
            {
                "name": "Global Office Supplies Co",
                "tax_id": "US-EIN-88120491",
                "avg_invoice_amount": 3200.00,
                "first_seen_date": "2025-02-10",
                "is_known": True,
            },
            {
                "name": "Vortex Digital Marketing Consultants",
                "tax_id": "US-EIN-77219401",
                "avg_invoice_amount": 8500.00,
                "first_seen_date": "2025-03-01",
                "is_known": True,
            },
            {
                "name": "Nexus Logistics & Express",
                "tax_id": "US-EIN-55912048",
                "avg_invoice_amount": 2500.00,
                "first_seen_date": "2025-04-20",
                "is_known": True,
            },
            {
                "name": "Acme Software Solutions LLC",
                "tax_id": "US-EIN-33910294",
                "avg_invoice_amount": 5000.00,
                "first_seen_date": "2025-05-12",
                "is_known": True,
            },
            {
                "name": "Starlight Event Planning Ltd",
                "tax_id": "US-EIN-11940182",
                "avg_invoice_amount": 4200.00,
                "first_seen_date": "2025-06-01",
                "is_known": True,
            },
            {
                "name": "Titan Heavy Machinery Corp",
                "tax_id": "US-EIN-44910283",
                "avg_invoice_amount": 18000.00,
                "first_seen_date": "2025-07-04",
                "is_known": True,
            },
            {
                "name": "Horizon Telecom Services",
                "tax_id": "US-EIN-66910238",
                "avg_invoice_amount": 950.00,
                "first_seen_date": "2025-08-11",
                "is_known": True,
            },
        ]

        for v_data in vendors_data:
            db.add(Vendor(**v_data))
        db.commit()

        # 2. Seed 10 Historical Invoices for Fraud Pattern Matching
        invoices_data = [
            {
                "invoice_number": "INV-APEX-1001",
                "vendor_name": "Apex Cloud Infrastructure Inc",
                "amount": 1450.00,
                "invoice_date": "2026-07-01",
                "status": "APPROVED",
                "reasoning": "Standard recurring infrastructure monthly billing.",
            },
            {
                "invoice_number": "INV-OFFICE-402",
                "vendor_name": "Global Office Supplies Co",
                "amount": 3200.00,
                "invoice_date": "2026-07-05",
                "status": "APPROVED",
                "reasoning": "Bulk office supplies purchase within normal range.",
            },
            {
                "invoice_number": "INV-DUP-9901",
                "vendor_name": "Global Office Supplies Co",
                "amount": 3200.00,
                "invoice_date": "2026-07-10",
                "status": "APPROVED",
                "reasoning": "Original invoice for executive ergonomics.",
            },
            {
                "invoice_number": "INV-DUP-9901",
                "vendor_name": "Global Office Supplies Co",
                "amount": 3200.00,
                "invoice_date": "2026-07-28",
                "status": "PENDING",
                "flags_json": '["DUPLICATE_INVOICE_NUMBER"]',
                "reasoning": "Duplicate invoice number flag raised for review.",
            },
            {
                "invoice_number": "INV-VORTEX-771",
                "vendor_name": "Vortex Digital Marketing Consultants",
                "amount": 65000.00,
                "invoice_date": "2026-07-29",
                "status": "PENDING",
                "flags_json": '["UNUSUAL_INVOICE_AMOUNT", "HIGH_VALUE_THRESHOLD"]',
                "reasoning": "Amount $65,000 vastly exceeds vendor average of $8,500.",
            },
            {
                "invoice_number": "INV-UNKNOWN-001",
                "vendor_name": "Phantom Consulting Group",
                "amount": 9800.00,
                "invoice_date": "2026-07-30",
                "status": "PENDING",
                "flags_json": '["UNKNOWN_VENDOR"]',
                "reasoning": "Vendor not found in verified master list.",
            },
            {
                "invoice_number": "INV-APEX-2004",
                "vendor_name": "Apex C1oud Infrastructure Inc",  # Typosquatting
                "amount": 1450.00,
                "invoice_date": "2026-08-01",
                "status": "PENDING",
                "flags_json": '["TYPOSQUATTING_TYPO_SIMILARITY"]',
                "reasoning": "Vendor name similarity match with known vendor 'Apex Cloud Infrastructure Inc'.",
            },
            {
                "invoice_number": "INV-NEXUS-881",
                "vendor_name": "Nexus Logistics & Express",
                "amount": 2480.00,
                "invoice_date": "2026-08-02",
                "status": "APPROVED",
                "reasoning": "Freight shipping invoice verified.",
            },
            {
                "invoice_number": "INV-ACME-902",
                "vendor_name": "Acme Software Solutions LLC",
                "amount": 25000.00,
                "invoice_date": "2026-08-03",
                "status": "PENDING",
                "flags_json": '["ROUND_NUMBER_ANOMALY"]',
                "reasoning": "Suspicious exact round amount $25,000.",
            },
            {
                "invoice_number": "INV-HORIZON-339",
                "vendor_name": "Horizon Telecom Services",
                "amount": 920.00,
                "invoice_date": "2026-08-04",
                "status": "APPROVED",
                "reasoning": "Standard telecom invoice.",
            },
        ]

        for inv_data in invoices_data:
            db.add(Invoice(**inv_data))
        db.commit()

        # Create a demo user for authentication testing
        from .auth import get_password_hash

        demo_user = {
            "email": "demo@fraudguard.ai",
            "full_name": "Demo User",
            "hashed_password": get_password_hash("demo1234"),
            "is_active": True,
        }

        db.add(User(**demo_user))
        db.commit()

        print(f"Successfully seeded {len(vendors_data)} vendors, {len(invoices_data)} invoices, and 1 demo user.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
