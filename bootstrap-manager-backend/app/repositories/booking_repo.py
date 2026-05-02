"""Booking repository"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.db import Booking
from app.domain.booking import BookingStatus
from app.repositories.base import BaseRepository


class BookingRepository(BaseRepository[Booking]):
    """Repository for Booking model"""

    def __init__(self, db: Session):
        super().__init__(db, Booking)

    def get_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Booking]:
        """
        Get bookings within a date range

        Args:
            start_date: Start of date range
            end_date: End of date range
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of bookings within date range
        """
        return (
            self.db.query(Booking)
            .filter(
                and_(
                    Booking.start_date >= start_date,
                    Booking.end_date <= end_date,
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_overlapping(
        self,
        boat_id: int,
        start_date: datetime,
        end_date: datetime,
        exclude_booking_id: Optional[int] = None,
    ) -> List[Booking]:
        """
        Get bookings that overlap with given time period

        Args:
            boat_id: Boat ID
            start_date: Start date to check
            end_date: End date to check
            exclude_booking_id: Optional booking ID to exclude from results

        Returns:
            List of overlapping bookings
        """
        query = self.db.query(Booking).filter(
            and_(
                Booking.boat_id == boat_id,
                Booking.start_date < end_date,
                Booking.end_date > start_date,
                Booking.status != BookingStatus.CANCELLED,
            )
        )

        if exclude_booking_id:
            query = query.filter(Booking.id != exclude_booking_id)

        return query.all()

    def get_by_status(
        self,
        status: BookingStatus,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Booking]:
        """
        Get bookings by status

        Args:
            status: Booking status to filter by
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of bookings with given status
        """
        return (
            self.db.query(Booking)
            .filter(Booking.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Booking]:
        """
        Get bookings created by a user

        Args:
            user_id: User ID who created bookings
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of bookings created by user
        """
        return (
            self.db.query(Booking)
            .filter(Booking.created_by_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_captain(
        self,
        captain_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Booking]:
        """
        Get bookings assigned to a captain

        Args:
            captain_id: Captain ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of bookings assigned to captain
        """
        return (
            self.db.query(Booking)
            .filter(Booking.captain_id == captain_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_boat(
        self,
        boat_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Booking]:
        """
        Get bookings for a specific boat

        Args:
            boat_id: Boat ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of bookings for boat
        """
        return (
            self.db.query(Booking)
            .filter(Booking.boat_id == boat_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
