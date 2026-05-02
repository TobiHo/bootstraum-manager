"""Pytest configuration and fixtures"""

import os
import sys

# Set test database URL before importing app modules
os.environ["DATABASE_URL"] = "sqlite:///./test_temp.db"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import pytest

from app.db.database import Base
from app.models.db import User, Boat, Captain
from app.domain.user import UserRole
from app.services.auth_service import hash_password


# Create test database
TEST_DATABASE_URL = "sqlite:///./test_temp.db"


@pytest.fixture(scope="function")
def test_db():
    """Create a test database and session"""
    # Create engine
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Create session factory
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    db = SessionLocal()

    yield db

    # Cleanup
    db.close()
    Base.metadata.drop_all(bind=engine)

    # Remove test database file
    if os.path.exists("test_temp.db"):
        os.remove("test_temp.db")


@pytest.fixture
def test_user(test_db: Session) -> User:
    """Create a test customer user"""
    user = User(
        email="customer@example.com",
        password_hash=hash_password("testpassword123"),
        name="Test Customer",
        role=UserRole.CUSTOMER,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def test_admin(test_db: Session) -> User:
    """Create a test admin user"""
    admin = User(
        email="admin@example.com",
        password_hash=hash_password("adminpassword123"),
        name="Test Admin",
        role=UserRole.ADMIN,
    )
    test_db.add(admin)
    test_db.commit()
    test_db.refresh(admin)
    return admin


@pytest.fixture
def test_boat(test_db: Session) -> Boat:
    """Create a test boat"""
    boat = Boat(
        name="Test Boat",
        capacity=10,
        boat_type="Speed Boat",
        description="A test boat for tours",
        available=True,
    )
    test_db.add(boat)
    test_db.commit()
    test_db.refresh(boat)
    return boat


@pytest.fixture
def test_captain(test_db: Session) -> Captain:
    """Create a test captain"""
    captain = Captain(
        name="Captain Test",
        email="captain@example.com",
        phone="+1234567890",
        certifications="Certified Boat Master",
    )
    test_db.add(captain)
    test_db.commit()
    test_db.refresh(captain)
    return captain
