"""Initialize database with default users"""

from app.db.database import SessionLocal, Base, engine
from app.models.db import User
from app.services.user_service import UserService
from app.models.schemas import UserCreate


def init_db():
    """Create tables and insert default admin user"""
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if admin user already exists
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
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
