"""Initialize database with default users, boats, and captains"""

from datetime import datetime, timedelta, time, date
from app.db.database import SessionLocal, Base, engine
from app.models.db import User, Boat, Captain, TourType, PublicTour
from app.services.user_service import UserService
from app.services.captain_assignment_service import CaptainAssignmentService
from app.models.schemas import UserCreate


def init_db():
    """Create tables and insert default data"""
    # Create tables
    Base.metadata.create_all(bind=engine)

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
            },
            {
                "slug": "charter",
                "name": "Exklusivfahrten",
                "description": "Mieten Sie das ganze Boot exklusiv für Ihre Gruppe – flexibel in Zeit, Route und Verpflegung.",
                "duration_minutes": 120,
                "price_per_ticket": 290.00,
                "min_participants": 1,
                "max_participants": 25,
            },
            {
                "slug": "punsch",
                "name": "Punschfahrten",
                "description": "Heißer Punsch, warme Decken und Winterstimmung auf der abendlichen Vechte.",
                "duration_minutes": 90,
                "price_per_ticket": 18.50,
                "min_participants": 1,
                "max_participants": 25,
            },
            {
                "slug": "ranger",
                "name": "Vechte-Ranger",
                "description": "Die Abenteuer-Tour für Kinder & Familien – mit Ranger-Programm an Bord.",
                "duration_minutes": 60,
                "price_per_ticket": 9.50,
                "min_participants": 1,
                "max_participants": 25,
            },
            {
                "slug": "sundowner",
                "name": "Sundowner",
                "description": "Sonnenuntergang vom Wasser aus erleben – mit Aperitif an Bord.",
                "duration_minutes": 90,
                "price_per_ticket": 22.00,
                "min_participants": 1,
                "max_participants": 25,
            },
            {
                "slug": "cliquentour",
                "name": "Cliquentour",
                "description": "Feiern mit Freunden auf der Vechte – Musik, Snacks und gute Laune inklusive.",
                "duration_minutes": 120,
                "price_per_ticket": 26.00,
                "min_participants": 1,
                "max_participants": 25,
            },
        ]
        for data in tour_types_seed:
            existing = db.query(TourType).filter(TourType.slug == data["slug"]).first()
            if not existing:
                db.add(TourType(**data))
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
    """Generate ~15 public tour slots per day across one big + one small boat,
    until end of October of the current year, with auto-assigned captains."""

    big_boat = db.query(Boat).filter(Boat.name == "Vechtesonne").first()
    small_boat = db.query(Boat).filter(Boat.name == "Vechtestromer").first()
    if not big_boat or not small_boat:
        print("✗ Skipping public tour seeding: boats missing")
        return

    today = date.today()
    year = today.year
    end_day = date(year, 10, 31)
    if end_day < today:
        end_day = date(year + 1, 10, 31)

    # Slot templates: (boat, start_time, duration_minutes)
    big_slots = [
        (time(10, 0), 90),
        (time(11, 30), 90),
        (time(13, 0), 90),
        (time(14, 30), 90),
        (time(16, 0), 90),
        (time(17, 30), 90),
        (time(19, 0), 90),
        (time(20, 30), 90),
    ]
    small_slots = [
        (time(10, 30), 60),
        (time(12, 0), 60),
        (time(13, 30), 60),
        (time(15, 0), 60),
        (time(16, 30), 60),
        (time(18, 0), 90),
        (time(19, 30), 90),
    ]
    # 8 + 7 = 15 slots/day

    tour_types = {tt.slug: tt for tt in db.query(TourType).all()}

    def pick_tour_type(start_dt: datetime):
        h = start_dt.hour
        # Sundowner ~17-19, Punsch >=20, Ranger at 13:30 small slot, else Rundfahrt with cliquentour late evenings
        if h >= 20:
            return tour_types.get("punsch") or tour_types.get("rundfahrt")
        if h >= 18:
            return tour_types.get("sundowner") or tour_types.get("rundfahrt")
        if start_dt.weekday() >= 5 and h == 13:
            return tour_types.get("cliquentour") or tour_types.get("rundfahrt")
        if h == 13 and start_dt.minute == 30:
            return tour_types.get("ranger") or tour_types.get("rundfahrt")
        return tour_types.get("rundfahrt")

    assigner = CaptainAssignmentService(db)
    created = 0
    day = today
    while day <= end_day:
        for boat, slots in ((big_boat, big_slots), (small_boat, small_slots)):
            for start_time, dur in slots:
                start_dt = datetime.combine(day, start_time)
                end_dt = start_dt + timedelta(minutes=dur)
                exists = (
                    db.query(PublicTour)
                    .filter(
                        PublicTour.boat_id == boat.id,
                        PublicTour.start_date == start_dt,
                    )
                    .first()
                )
                if exists:
                    continue
                tt = pick_tour_type(start_dt)
                if not tt:
                    continue
                captain_id = assigner.assign(boat.id, start_dt, end_dt)
                pt = PublicTour(
                    tour_type_id=tt.id,
                    boat_id=boat.id,
                    captain_id=captain_id,
                    start_date=start_dt,
                    end_date=end_dt,
                    seats_total=boat.capacity,
                    seats_booked=0,
                    status="scheduled",
                )
                db.add(pt)
                created += 1
        # commit per day to keep transactions small
        db.commit()
        day += timedelta(days=1)

    if created:
        print(f"✓ Seeded {created} public tour slots until {end_day}")
    else:
        print("✓ Public tours already up-to-date")


if __name__ == "__main__":
    init_db()
