"""SQLAlchemy ORM models"""

from datetime import datetime
from typing import List
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Enum,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    Table,
)
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.domain.user import UserRole
from app.domain.booking import BookingStatus


# Association table for many-to-many relationship between Captain and Boat
CaptainBoat = Table(
    "captain_boat",
    Base.metadata,
    Column("captain_id", Integer, ForeignKey("captain.id", ondelete="CASCADE"), primary_key=True),
    Column("boat_id", Integer, ForeignKey("boat.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    """User model - represents system users"""

    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    bookings = relationship("Booking", back_populates="created_by_user", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("email", name="uq_user_email"),
    )


class Boat(Base):
    """Boat model - represents boats available for tours"""

    __tablename__ = "boat"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    capacity = Column(Integer, nullable=False)
    boat_type = Column(String(100), nullable=False)
    description = Column(String(500))
    available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    captains = relationship(
        "Captain",
        secondary=CaptainBoat,
        back_populates="boats",
    )
    bookings = relationship("Booking", back_populates="boat", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("capacity > 0", name="check_boat_capacity_positive"),
        UniqueConstraint("name", name="uq_boat_name"),
    )


class Captain(Base):
    """Captain model - represents captains who operate boats"""

    __tablename__ = "captain"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    certifications = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    boats = relationship(
        "Boat",
        secondary=CaptainBoat,
        back_populates="captains",
    )
    bookings = relationship("Booking", back_populates="captain", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("email", name="uq_captain_email"),
    )

    @property
    def available_boats(self) -> List[int]:
        """Return assigned boat IDs for API responses."""
        return [boat.id for boat in self.boats]


class Booking(Base):
    """Booking model - represents boat tour bookings"""

    __tablename__ = "booking"

    id = Column(Integer, primary_key=True, index=True)
    boat_id = Column(Integer, ForeignKey("boat.id", ondelete="CASCADE"), nullable=False, index=True)
    captain_id = Column(Integer, ForeignKey("captain.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=False)
    participants = Column(Integer, nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    tour_type = Column(String(50), nullable=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False, index=True)
    notes = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    boat = relationship("Boat", back_populates="bookings")
    captain = relationship("Captain", back_populates="bookings")
    created_by_user = relationship("User", back_populates="bookings")

    __table_args__ = (
        CheckConstraint("end_date > start_date", name="check_booking_end_after_start"),
        CheckConstraint("participants > 0", name="check_booking_participants_positive"),
        UniqueConstraint(
            "boat_id", "start_date", "end_date", "status",
            name="uq_booking_boat_time_confirmed",
        ),
    )
