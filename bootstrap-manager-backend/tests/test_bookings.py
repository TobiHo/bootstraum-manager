"""Tests for bookings service"""

import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.db import Booking, Boat, Captain, User
from app.models.schemas import BookingCreate, BookingUpdate
from app.domain.booking import BookingStatus


@pytest.fixture
def booking_service(test_db: Session, test_user: User):
    """Create a mock booking service for testing"""
    class MockBookingService:
        def __init__(self, db: Session, user: User):
            self.db = db
            self.user = user

        def create_booking(self, data: BookingCreate, created_by_id: int = None) -> Booking:
            booking = Booking(
                boat_id=data.boat_id,
                captain_id=data.captain_id,
                created_by_id=created_by_id or self.user.id,
                start_date=data.start_date,
                end_date=data.end_date,
                participants=data.participants,
                customer_name=data.customer_name,
                customer_email=data.customer_email,
                customer_phone=data.customer_phone,
                status=BookingStatus.PENDING,
                notes=data.notes,
            )
            self.db.add(booking)
            self.db.commit()
            self.db.refresh(booking)
            return booking

        def get_booking(self, booking_id: int) -> Booking | None:
            return self.db.query(Booking).filter(Booking.id == booking_id).first()

        def list_bookings(self) -> list[Booking]:
            return self.db.query(Booking).all()

        def update_booking(self, booking_id: int, data: BookingUpdate) -> Booking | None:
            booking = self.get_booking(booking_id)
            if not booking:
                return None
            for field, value in data.dict(exclude_unset=True).items():
                setattr(booking, field, value)
            self.db.commit()
            self.db.refresh(booking)
            return booking

        def delete_booking(self, booking_id: int) -> bool:
            booking = self.get_booking(booking_id)
            if not booking:
                return False
            self.db.delete(booking)
            self.db.commit()
            return True

        def confirm_booking(self, booking_id: int) -> Booking | None:
            booking = self.get_booking(booking_id)
            if not booking:
                return None
            booking.status = BookingStatus.CONFIRMED
            self.db.commit()
            self.db.refresh(booking)
            return booking

    return MockBookingService(test_db, test_user)


class TestBookingCreation:
    """Tests for booking creation"""

    def test_create_booking(
        self, test_db: Session, test_boat: Boat, test_captain: Captain, test_user: User, booking_service
    ):
        """Test creating a new booking"""
        now = datetime.now(timezone.utc)
        booking_data = BookingCreate(
            boat_id=test_boat.id,
            captain_id=test_captain.id,
            start_date=now + timedelta(days=1),
            end_date=now + timedelta(days=2),
            participants=5,
            customer_name="John Doe",
            customer_email="john@example.com",
            customer_phone="+1234567890",
            notes="Special request for sightseeing",
        )

        booking = booking_service.create_booking(booking_data)

        assert booking is not None
        assert booking.boat_id == test_boat.id
        assert booking.captain_id == test_captain.id
        assert booking.created_by_id == test_user.id
        assert booking.participants == 5
        assert booking.customer_name == "John Doe"
        assert booking.status == BookingStatus.PENDING

    def test_create_booking_invalid_dates(
        self, test_db: Session, test_boat: Boat, test_captain: Captain, test_user: User, booking_service
    ):
        """Test creating booking with end_date before start_date"""
        from sqlalchemy.exc import IntegrityError
        now = datetime.now(timezone.utc)
        booking_data = BookingCreate(
            boat_id=test_boat.id,
            captain_id=test_captain.id,
            start_date=now + timedelta(days=2),
            end_date=now + timedelta(days=1),  # End before start
            participants=5,
            customer_name="John Doe",
            customer_email="john@example.com",
            customer_phone="+1234567890",
        )

        with pytest.raises(IntegrityError):  # Should raise constraint error
            booking_service.create_booking(booking_data)

    def test_create_booking_invalid_participants(
        self, test_db: Session, test_boat: Boat, test_captain: Captain, test_user: User, booking_service
    ):
        """Test creating booking with invalid participant count"""
        from pydantic_core import ValidationError
        now = datetime.now(timezone.utc)

        with pytest.raises(ValidationError):  # Should raise validation error from Pydantic
            booking_data = BookingCreate(
                boat_id=test_boat.id,
                captain_id=test_captain.id,
                    start_date=now + timedelta(days=1),
                end_date=now + timedelta(days=2),
                participants=0,  # Invalid
                customer_name="John Doe",
                customer_email="john@example.com",
                customer_phone="+1234567890",
            )


class TestDoubleBookingPrevention:
    """Tests for double booking prevention"""

    def test_double_booking_prevention(
        self,
        test_db: Session,
        test_boat: Boat,
        test_captain: Captain,
        test_user: User,
        booking_service,
    ):
        """Test that double booking is prevented"""
        from sqlalchemy.exc import IntegrityError
        now = datetime.now(timezone.utc)
        start_date = now + timedelta(days=1)
        end_date = now + timedelta(days=2)

        # Create first booking
        booking_data_1 = BookingCreate(
            boat_id=test_boat.id,
            captain_id=test_captain.id,
            start_date=start_date,
            end_date=end_date,
            participants=5,
            customer_name="John Doe",
            customer_email="john@example.com",
            customer_phone="+1234567890",
        )
        booking1 = booking_service.create_booking(booking_data_1)
        booking_service.confirm_booking(booking1.id)  # Confirm first booking

        # Try to create overlapping booking
        booking_data_2 = BookingCreate(
            boat_id=test_boat.id,
            captain_id=test_captain.id,
            start_date=start_date,  # Same start (will cause conflict when confirmed)
            end_date=end_date,  # Same end
            participants=3,
            customer_name="Jane Doe",
            customer_email="jane@example.com",
            customer_phone="+0987654321",
        )

        booking2 = booking_service.create_booking(booking_data_2)
        # This should raise an error due to unique constraint on confirmed booking
        with pytest.raises(IntegrityError):
            booking_service.confirm_booking(booking2.id)

    def test_back_to_back_bookings_allowed(
        self,
        test_db: Session,
        test_boat: Boat,
        test_captain: Captain,
        test_user: User,
        booking_service,
    ):
        """Test that back-to-back bookings (no overlap) are allowed"""
        now = datetime.now(timezone.utc)
        start_date1 = now + timedelta(days=1)
        end_date1 = now + timedelta(days=2)
        start_date2 = end_date1  # Starts when first ends
        end_date2 = now + timedelta(days=3)

        # Create first booking
        booking_data_1 = BookingCreate(
            boat_id=test_boat.id,
            captain_id=test_captain.id,
            start_date=start_date1,
            end_date=end_date1,
            participants=5,
            customer_name="John Doe",
            customer_email="john@example.com",
            customer_phone="+1234567890",
        )
        booking1 = booking_service.create_booking(booking_data_1)
        booking_service.confirm_booking(booking1.id)

        # Create second booking (back-to-back)
        booking_data_2 = BookingCreate(
            boat_id=test_boat.id,
            captain_id=test_captain.id,
            start_date=start_date2,
            end_date=end_date2,
            participants=3,
            customer_name="Jane Doe",
            customer_email="jane@example.com",
            customer_phone="+0987654321",
        )

        # This should succeed (no overlap)
        booking2 = booking_service.create_booking(booking_data_2)
        assert booking2 is not None
        assert booking2.status == BookingStatus.PENDING


class TestBookingRetrieval:
    """Tests for booking retrieval"""

    def test_get_booking(
        self, test_db: Session, test_boat: Boat, test_captain: Captain, test_user: User, booking_service
    ):
        """Test getting a booking by ID"""
        now = datetime.now(timezone.utc)
        booking_data = BookingCreate(
            boat_id=test_boat.id,
            captain_id=test_captain.id,
            start_date=now + timedelta(days=1),
            end_date=now + timedelta(days=2),
            participants=5,
            customer_name="John Doe",
            customer_email="john@example.com",
            customer_phone="+1234567890",
        )

        created_booking = booking_service.create_booking(booking_data)
        retrieved_booking = booking_service.get_booking(created_booking.id)

        assert retrieved_booking is not None
        assert retrieved_booking.id == created_booking.id
        assert retrieved_booking.customer_name == "John Doe"

    def test_get_booking_not_found(self, booking_service):
        """Test getting a non-existent booking"""
        booking = booking_service.get_booking(9999)

        assert booking is None

    def test_list_bookings(
        self,
        test_db: Session,
        test_boat: Boat,
        test_captain: Captain,
        test_user: User,
        booking_service,
    ):
        """Test listing bookings"""
        now = datetime.now(timezone.utc)

        # Create multiple bookings
        for i in range(3):
            booking_data = BookingCreate(
                boat_id=test_boat.id,
                captain_id=test_captain.id,
                    start_date=now + timedelta(days=10 + i * 10),
                end_date=now + timedelta(days=11 + i * 10),
                participants=5 + i,
                customer_name=f"Customer {i}",
                customer_email=f"customer{i}@example.com",
                customer_phone=f"+123456789{i}",
            )
            booking_service.create_booking(booking_data)

        bookings = booking_service.list_bookings()

        assert len(bookings) >= 3
        assert all(isinstance(b, Booking) for b in bookings)


class TestBookingUpdate:
    """Tests for booking updates"""

    def test_update_booking(
        self,
        test_db: Session,
        test_boat: Boat,
        test_captain: Captain,
        test_user: User,
        booking_service,
    ):
        """Test updating a booking"""
        now = datetime.now(timezone.utc)
        booking_data = BookingCreate(
            boat_id=test_boat.id,
            captain_id=test_captain.id,
            start_date=now + timedelta(days=1),
            end_date=now + timedelta(days=2),
            participants=5,
            customer_name="John Doe",
            customer_email="john@example.com",
            customer_phone="+1234567890",
        )

        booking = booking_service.create_booking(booking_data)

        update_data = BookingUpdate(
            customer_name="Jane Doe",
            participants=10,
            notes="Updated booking",
        )

        updated_booking = booking_service.update_booking(booking.id, update_data)

        assert updated_booking is not None
        assert updated_booking.customer_name == "Jane Doe"
        assert updated_booking.participants == 10
        assert updated_booking.notes == "Updated booking"

    def test_update_booking_not_found(self, booking_service):
        """Test updating a non-existent booking"""
        update_data = BookingUpdate(customer_name="Updated Name")

        updated_booking = booking_service.update_booking(9999, update_data)

        assert updated_booking is None


class TestBookingDeletion:
    """Tests for booking deletion"""

    def test_delete_booking(
        self,
        test_db: Session,
        test_boat: Boat,
        test_captain: Captain,
        test_user: User,
        booking_service,
    ):
        """Test deleting a booking"""
        now = datetime.now(timezone.utc)
        booking_data = BookingCreate(
            boat_id=test_boat.id,
            captain_id=test_captain.id,
            start_date=now + timedelta(days=1),
            end_date=now + timedelta(days=2),
            participants=5,
            customer_name="John Doe",
            customer_email="john@example.com",
            customer_phone="+1234567890",
        )

        booking = booking_service.create_booking(booking_data)
        booking_id = booking.id

        success = booking_service.delete_booking(booking_id)

        assert success is True
        assert booking_service.get_booking(booking_id) is None

    def test_delete_booking_not_found(self, booking_service):
        """Test deleting a non-existent booking"""
        success = booking_service.delete_booking(9999)

        assert success is False
