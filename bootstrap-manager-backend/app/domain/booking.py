"""Booking domain models and enums"""

from enum import Enum


class BookingStatus(str, Enum):
    """Status of a booking"""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
