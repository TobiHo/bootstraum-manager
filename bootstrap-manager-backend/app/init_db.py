"""Initialize database with default users, boats, and captains"""

from app.db.database import SessionLocal, Base, engine
from app.models.db import User, Boat, Captain
from app.services.user_service import UserService
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
    except Exception as e:
        db.rollback()
        print(f"✗ Error during database initialization: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
