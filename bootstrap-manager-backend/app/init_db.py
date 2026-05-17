"""Initialize database with default users, boats, and captains"""

from datetime import datetime, timedelta, time, date
from app.db.database import SessionLocal, Base, engine
from app.models.db import User, Boat, Captain, TourType, PublicTour
from app.services.user_service import UserService
from app.services.captain_assignment_service import CaptainAssignmentService
from app.models.schemas import UserCreate
from sqlalchemy import text, inspect


def _ensure_columns():
    """Lightweight migration: add new columns if missing (SQLite/Postgres safe)."""
    inspector = inspect(engine)
    additions = [
        ("tour_type", "category", "VARCHAR(20) DEFAULT 'rundfahrt' NOT NULL"),
        ("public_tour", "cancellation_reason", "VARCHAR(500)"),
        ("booking", "booking_kind", "VARCHAR(20) DEFAULT 'charter' NOT NULL"),
        ("booking", "catering", "BOOLEAN DEFAULT FALSE NOT NULL"),
        ("booking", "total_price", "FLOAT DEFAULT 0.0 NOT NULL"),
        ("booking", "payment_status", "VARCHAR(20) DEFAULT 'unpaid' NOT NULL"),
        ("booking", "public_tour_id", "INTEGER"),
    ]
    with engine.begin() as conn:
        for table, col, ddl in additions:
            if table not in inspector.get_table_names():
                continue
            cols = [c["name"] for c in inspector.get_columns(table)]
            if col in cols:
                continue
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}"))
                print(f"✓ Added column {table}.{col}")
            except Exception as e:
                print(f"  (skip column {table}.{col}: {e})")


def init_db():
    """Create tables and insert default data"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    _ensure_columns()

    db = SessionLocal()
    try:
        # Create admin user if not exists
        admin = db.query(User).filter(User.email == "testadmin@example.com").first()
        if not admin:
            user_service = UserService(db)
            user_create = UserCreate(
                email="testadmin@example.com",
                password="testpass123",
                name="Test Admin",
                role="admin"
            )
            user_service.register(user_create)
            print("✓ Default admin user created: testadmin@example.com")
        else:
            print("✓ Admin user already exists")

        # Create boats if not exist
        boats_data = [
            ("Vechtestromer", 14, "Passagierschiff", "Kleine gemütliche Bootsfahrt für bis zu 14 Personen"),
            ("Vechtesonne", 25, "Passagierschiff", "Größeres Schiff für bis zu 25 Personen - ideal für Gruppen"),
            ("Vechteschute", 25, "Passagierschiff", "Traditionelle Schute für bis zu 25 Personen"),
            ("Vechteprahm", 25, "Passagierschiff", "Geräumiges Schiff mit bis zu 25 Plätzen"),
        ]

        boat_ids = {}
        for boat_name, capacity, boat_type, description in boats_data:
            boat = db.query(Boat).filter(Boat.name == boat_name).first()
            if not boat:
                boat = Boat(
                    name=boat_name,
                    capacity=capacity,
                    boat_type=boat_type,
                    description=description,
                    available=True
                )
                db.add(boat)
                db.flush()
                print(f"✓ Created boat: {boat_name}")
            boat_ids[boat_name] = boat.id

        # Create captains if not exist
        captains_data = [
            ("Norbert Veldboer", "norbert.veldboer@vvv-nordhorn.de"),
            ("Jochen Röhrig", "jochen.rohrig@vvv-nordhorn.de"),
            ("Wolfgang Neuwinger", "wolfgang.neuwinger@vvv-nordhorn.de"),
            ("Reinhard König", "reinhard.koenig@vvv-nordhorn.de"),
            ("Wolfgang Bucher", "wolfgang.bucher@vvv-nordhorn.de"),
            ("Dieter Blekker", "dieter.blekker@vvv-nordhorn.de"),
            ("Horst Schlapmann", "horst.schlapmann@vvv-nordhorn.de"),
            ("Hein Küsters", "hein.kusters@vvv-nordhorn.de"),
            ("Holger Sebelin", "holger.sebelin@vvv-nordhorn.de"),
            ("Helge Sonnenberg", "helge.sonnenberg@vvv-nordhorn.de"),
            ("Vitor Loureiro", "vitor.loureiro@vvv-nordhorn.de"),
            ("Ilona Revermann", "ilona.revermann@vvv-nordhorn.de"),
            ("Joachim Woltering", "joachim.woltering@vvv-nordhorn.de"),
            ("Bernhard Raffkes", "bernhard.raffkes@vvv-nordhorn.de"),
            ("Martin Ameloh", "martin.ameloh@vvv-nordhorn.de"),
            ("Volker Hoffmann", "volker.hoffmann@vvv-nordhorn.de"),
        ]

        phone = "+49 5921 8039-0"
        captain_ids = []
        for captain_name, captain_email in captains_data:
            captain = db.query(Captain).filter(Captain.email == captain_email).first()
            if not captain:
                captain = Captain(
                    name=captain_name,
                    email=captain_email,
                    phone=phone,
                    certifications="Schiffsführer"
                )
                db.add(captain)
                db.flush()
                print(f"✓ Created captain: {captain_name}")
            captain_ids.append(captain.id)

        # Assign captains to boats
        boat_list = list(boat_ids.values())
        assignments = [
            (boat_ids["Vechtestromer"], [captain_ids[0], captain_ids[1], captain_ids[2]]),
            (boat_ids["Vechtesonne"], [captain_ids[3], captain_ids[4], captain_ids[5], captain_ids[6]]),
            (boat_ids["Vechteschute"], [captain_ids[7], captain_ids[8], captain_ids[9], captain_ids[10]]),
            (boat_ids["Vechteprahm"], [captain_ids[11], captain_ids[12], captain_ids[13], captain_ids[14], captain_ids[15]]),
        ]

        for boat_id, cap_ids in assignments:
            boat = db.query(Boat).filter(Boat.id == boat_id).first()
            for cap_id in cap_ids:
                captain = db.query(Captain).filter(Captain.id == cap_id).first()
                if captain not in boat.captains:
                    boat.captains.append(captain)

        db.commit()
        print("✓ Demo data initialization complete")

        # Seed tour types for the public webshop
        tour_types_seed = [
            {
                "slug": "rundfahrt",
                "name": "Öffentliche Rundfahrten",
                "description": "Die klassische 90-minütige City-Rundfahrt auf der Vechte – entspannt durchs Herz von Nordhorn.",
                "duration_minutes": 90,
                "price_per_ticket": 14.50,
                "min_participants": 1,
                "max_participants": 25,
                "category": "rundfahrt",
            },
            {
                "slug": "charter",
                "name": "Exklusivfahrten",
                "description": "Mieten Sie das ganze Boot exklusiv für Ihre Gruppe – flexibel in Zeit, Route und Verpflegung.",
                "duration_minutes": 120,
                "price_per_ticket": 290.00,
                "min_participants": 1,
                "max_participants": 25,
                "category": "event",
            },
            {
                "slug": "punsch",
                "name": "Punschfahrten",
                "description": "Heißer Punsch, warme Decken und Winterstimmung auf der abendlichen Vechte.",
                "duration_minutes": 90,
                "price_per_ticket": 18.50,
                "min_participants": 1,
                "max_participants": 25,
                "category": "event",
            },
            {
                "slug": "ranger",
                "name": "Vechte-Ranger",
                "description": "Die Abenteuer-Tour für Kinder & Familien – mit Ranger-Programm an Bord.",
                "duration_minutes": 60,
                "price_per_ticket": 9.50,
                "min_participants": 1,
                "max_participants": 25,
                "category": "event",
            },
            {
                "slug": "sundowner",
                "name": "Sundowner",
                "description": "Sonnenuntergang vom Wasser aus erleben – mit Aperitif an Bord.",
                "duration_minutes": 90,
                "price_per_ticket": 22.00,
                "min_participants": 1,
                "max_participants": 25,
                "category": "event",
            },
            {
                "slug": "cliquentour",
                "name": "Cliquentour",
                "description": "Feiern mit Freunden auf der Vechte – Musik, Snacks und gute Laune inklusive.",
                "duration_minutes": 120,
                "price_per_ticket": 26.00,
                "min_participants": 1,
                "max_participants": 25,
                "category": "event",
            },
        ]
        for data in tour_types_seed:
            existing = db.query(TourType).filter(TourType.slug == data["slug"]).first()
            if not existing:
                db.add(TourType(**data))
            else:
                # backfill category if missing
                if not getattr(existing, "category", None):
                    existing.category = data.get("category", "rundfahrt")
        db.commit()
        print("✓ Tour types seeded")

        # Seed daily public tours until end of October (current year)
        seed_public_tours(db)
    except Exception as e:
        db.rollback()
        print(f"✗ Error during database initialization: {e}")
        raise
    finally:
        db.close()


def seed_public_tours(db):
    """Seed recurring public tour series:
      Rundfahrten:
        • April:           1× 15:00
        • Mai–September:   2× 13:00 + 15:00
        • Oktober–November: 1× 15:00
      Punschfahrten:
        • 18.–25. Mai:     1× 15:00
        • Oktober:         1× 19:00
        • November–Dezember: 2× 19:00 + 21:00
      Sundowner:
        • Juni:            1× 21:00
        • Juli–September:  2× 21:00 + 22:00
    """

    boat = db.query(Boat).filter(Boat.name == "Vechtesonne").first()
    if not boat:
        print("✗ Skipping public tour seeding: Vechtesonne missing")
        return

    tour_types = {tt.slug: tt for tt in db.query(TourType).all()}
    assigner = CaptainAssignmentService(db)

    today = date.today()
    year = today.year
    if today.month == 12 and today.day > 25:
        year += 1
    plan_end = date(year + 1, 1, 31)  # cover Dec-Punsch into next January? keep to Dec
    plan_end = date(year, 12, 31)
    start_day = today

    def rundfahrt_slots(d: date):
        m = d.month
        if m == 4 or m in (10, 11):
            return [time(15, 0)]
        if 5 <= m <= 9:
            return [time(13, 0), time(15, 0)]
        return []

    def punsch_slots(d: date):
        m, day_ = d.month, d.day
        if m == 5 and 18 <= day_ <= 25:
            return [time(15, 0)]
        if m == 10:
            return [time(19, 0)]
        if m in (11, 12):
            return [time(19, 0), time(21, 0)]
        return []

    def sundowner_slots(d: date):
        m = d.month
        if m == 6:
            return [time(21, 0)]
        if 7 <= m <= 9:
            return [time(21, 0), time(22, 0)]
        return []

    series = [
        ("rundfahrt", rundfahrt_slots),
        ("punsch", punsch_slots),
        ("sundowner", sundowner_slots),
    ]

    total_created = 0
    for slug, slots_fn in series:
        tt = tour_types.get(slug)
        if not tt:
            print(f"  (skip seeding {slug}: tour type missing)")
            continue
        duration = tt.duration_minutes or 90
        created = 0
        day = start_day
        while day <= plan_end:
            for slot_time in slots_fn(day):
                start_dt = datetime.combine(day, slot_time)
                end_dt = start_dt + timedelta(minutes=duration)
                exists = (
                    db.query(PublicTour)
                    .filter(
                        PublicTour.boat_id == boat.id,
                        PublicTour.tour_type_id == tt.id,
                        PublicTour.start_date == start_dt,
                    )
                    .first()
                )
                if exists:
                    continue
                captain_id = assigner.assign(boat.id, start_dt, end_dt)
                db.add(PublicTour(
                    tour_type_id=tt.id,
                    boat_id=boat.id,
                    captain_id=captain_id,
                    start_date=start_dt,
                    end_date=end_dt,
                    seats_total=boat.capacity,
                    seats_booked=0,
                    status="scheduled",
                ))
                created += 1
            day += timedelta(days=1)
        db.commit()
        total_created += created
        print(f"✓ Seeded {created} {slug} slots through {plan_end}")

    if not total_created:
        print("✓ Public tour slots already up-to-date")


if __name__ == "__main__":
    init_db()
