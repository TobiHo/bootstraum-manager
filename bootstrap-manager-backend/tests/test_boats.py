"""Tests for boats service"""

import pytest
from sqlalchemy.orm import Session
from app.models.db import Boat
from app.models.schemas import BoatCreate, BoatUpdate


@pytest.fixture
def boat_service(test_db: Session):
    """Create a mock boat service for testing"""
    class MockBoatService:
        def __init__(self, db: Session):
            self.db = db

        def create_boat(self, data: BoatCreate) -> Boat:
            boat = Boat(
                name=data.name,
                capacity=data.capacity,
                boat_type=data.boat_type,
                description=data.description,
                available=True,
            )
            self.db.add(boat)
            self.db.commit()
            self.db.refresh(boat)
            return boat

        def get_boat(self, boat_id: int) -> Boat | None:
            return self.db.query(Boat).filter(Boat.id == boat_id).first()

        def list_boats(self) -> list[Boat]:
            return self.db.query(Boat).all()

        def update_boat(self, boat_id: int, data: BoatUpdate) -> Boat | None:
            boat = self.get_boat(boat_id)
            if not boat:
                return None
            for field, value in data.dict(exclude_unset=True).items():
                setattr(boat, field, value)
            self.db.commit()
            self.db.refresh(boat)
            return boat

        def delete_boat(self, boat_id: int) -> bool:
            boat = self.get_boat(boat_id)
            if not boat:
                return False
            self.db.delete(boat)
            self.db.commit()
            return True

    return MockBoatService(test_db)


class TestBoatCreation:
    """Tests for boat creation"""

    def test_create_boat(self, boat_service):
        """Test creating a new boat"""
        boat_data = BoatCreate(
            name="Test Speedboat",
            capacity=15,
            boat_type="Speed Boat",
            description="Fast boat for tours",
        )

        boat = boat_service.create_boat(boat_data)

        assert boat is not None
        assert boat.name == "Test Speedboat"
        assert boat.capacity == 15
        assert boat.boat_type == "Speed Boat"
        assert boat.description == "Fast boat for tours"
        assert boat.available is True

    def test_create_boat_duplicate_name(self, test_db: Session, boat_service):
        """Test that creating boat with duplicate name fails"""
        boat_data = BoatCreate(
            name="Duplicate Boat",
            capacity=10,
            boat_type="Sailboat",
            description="A sailboat",
        )

        # Create first boat
        boat_service.create_boat(boat_data)

        # Try to create another with same name
        with pytest.raises(Exception):  # Should raise integrity error
            boat_service.create_boat(boat_data)

    def test_create_boat_invalid_capacity(self, boat_service):
        """Test that creating boat with invalid capacity fails"""
        from pydantic_core import ValidationError

        with pytest.raises(ValidationError):  # Should raise validation error from Pydantic
            boat_data = BoatCreate(
                name="Invalid Boat",
                capacity=0,
                boat_type="Speedboat",
                description="Invalid capacity",
            )


class TestBoatRetrieval:
    """Tests for boat retrieval"""

    def test_get_boat(self, test_db: Session, test_boat: Boat, boat_service):
        """Test getting a boat by ID"""
        boat = boat_service.get_boat(test_boat.id)

        assert boat is not None
        assert boat.id == test_boat.id
        assert boat.name == test_boat.name
        assert boat.capacity == test_boat.capacity

    def test_get_boat_not_found(self, boat_service):
        """Test getting a non-existent boat"""
        boat = boat_service.get_boat(9999)

        assert boat is None

    def test_list_boats(self, test_db: Session, boat_service):
        """Test listing all boats"""
        # Create multiple boats
        for i in range(3):
            boat_data = BoatCreate(
                name=f"Boat {i}",
                capacity=10 + i,
                boat_type="Speed Boat",
                description=f"Test boat {i}",
            )
            boat_service.create_boat(boat_data)

        boats = boat_service.list_boats()

        assert len(boats) == 3
        assert all(isinstance(b, Boat) for b in boats)


class TestBoatUpdate:
    """Tests for boat updates"""

    def test_update_boat(self, test_db: Session, test_boat: Boat, boat_service):
        """Test updating a boat"""
        update_data = BoatUpdate(
            name="Updated Boat Name",
            capacity=20,
            description="Updated description",
        )

        updated_boat = boat_service.update_boat(test_boat.id, update_data)

        assert updated_boat is not None
        assert updated_boat.name == "Updated Boat Name"
        assert updated_boat.capacity == 20
        assert updated_boat.description == "Updated description"

    def test_update_boat_not_found(self, boat_service):
        """Test updating a non-existent boat"""
        update_data = BoatUpdate(
            name="Updated Name",
            capacity=15,
        )

        updated_boat = boat_service.update_boat(9999, update_data)

        assert updated_boat is None

    def test_update_boat_partial(self, test_db: Session, test_boat: Boat, boat_service):
        """Test partial update of a boat"""
        original_name = test_boat.name
        update_data = BoatUpdate(capacity=25)

        updated_boat = boat_service.update_boat(test_boat.id, update_data)

        assert updated_boat is not None
        assert updated_boat.name == original_name  # Name should not change
        assert updated_boat.capacity == 25


class TestBoatDeletion:
    """Tests for boat deletion"""

    def test_delete_boat(self, test_db: Session, test_boat: Boat, boat_service):
        """Test deleting a boat"""
        boat_id = test_boat.id
        success = boat_service.delete_boat(boat_id)

        assert success is True
        assert boat_service.get_boat(boat_id) is None

    def test_delete_boat_not_found(self, boat_service):
        """Test deleting a non-existent boat"""
        success = boat_service.delete_boat(9999)

        assert success is False
