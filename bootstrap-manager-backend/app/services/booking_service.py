"""Booking business logic service"""

from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.db import Booking, Boat, Captain
from app.models.schemas import BookingCreate, BookingUpdate, BookingResponse
from app.repositories.booking_repo import BookingRepository
from app.domain.booking import BookingStatus


class BookingService:
    """Service for booking business logic"""

    def __init__(self, db: Session):
        """
        Initialize booking service

        Args:
            db: SQLAlchemy session
        """
        self.db = db
        self.repo = BookingRepository(db)

    def create_booking(self, booking_in: BookingCreate, created_by_id: int) -> BookingResponse:
        """
        Create a new booking with validation

        Validates:
        - Boat capacity meets participant count
        - No double bookings
        - Captain is qualified if provided
        - No time conflicts

        Args:
            booking_in: Booking creation data
            created_by_id: ID of user creating the booking

        Returns:
            BookingResponse with created booking data

        Raises:
            HTTPException: If validation fails
        """
        # Verify boat exists and capacity is sufficient
        boat = self.db.query(Boat).filter(Boat.id == booking_in.boat_id).first()
        if not boat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Boat not found",
            )

        if booking_in.participants > boat.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Boat capacity ({boat.capacity}) is less than participants ({booking_in.participants})",
            )

        # Check for overlapping bookings (double booking prevention)
        overlapping = self.repo.get_overlapping(
            boat_id=booking_in.boat_id,
            start_date=booking_in.start_date,
            end_date=booking_in.end_date,
        )
        if overlapping:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Boat is not available for the requested time period",
            )

        # Verify captain if provided
        if booking_in.captain_id:
            captain = self.db.query(Captain).filter(Captain.id == booking_in.captain_id).first()
            if not captain:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Captain not found",
                )

            # Check if captain can operate this boat
            from app.repositories.captain_repo import CaptainRepository
            captain_repo = CaptainRepository(self.db)
            if not captain_repo.can_operate_boat(booking_in.captain_id, booking_in.boat_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Captain is not qualified to operate this boat",
                )

        booking = Booking(
            boat_id=booking_in.boat_id,
            captain_id=booking_in.captain_id,
            created_by_id=created_by_id,
            start_date=booking_in.start_date,
            end_date=booking_in.end_date,
            participants=booking_in.participants,
            customer_name=booking_in.customer_name,
            customer_email=booking_in.customer_email,
            customer_phone=booking_in.customer_phone,
            notes=booking_in.notes,
            status=BookingStatus.PENDING,
        )

        created_booking = self.repo.create(booking)
        return BookingResponse.from_orm(created_booking)

    def get_booking(self, booking_id: int) -> Optional[BookingResponse]:
        """
        Get booking by ID

        Args:
            booking_id: Booking ID

        Returns:
            BookingResponse if found, None otherwise
        """
        booking = self.repo.get(booking_id)
        if not booking:
            return None
        return BookingResponse.from_orm(booking)

    def get_all_bookings(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[BookingStatus] = None,
        boat_id: Optional[int] = None,
        captain_id: Optional[int] = None,
    ) -> List[BookingResponse]:
        """
        Get all bookings with optional filters

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Optional booking status to filter by
            boat_id: Optional boat ID to filter by
            captain_id: Optional captain ID to filter by

        Returns:
            List of BookingResponse objects
        """
        query = self.db.query(Booking)

        if status:
            query = query.filter(Booking.status == status)

        if boat_id:
            query = query.filter(Booking.boat_id == boat_id)

        if captain_id:
            query = query.filter(Booking.captain_id == captain_id)

        bookings = query.offset(skip).limit(limit).all()
        return [BookingResponse.from_orm(booking) for booking in bookings]

    def get_user_bookings(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[BookingResponse]:
        """
        Get bookings created by a user

        Args:
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of BookingResponse objects
        """
        bookings = self.repo.get_by_user(user_id, skip=skip, limit=limit)
        return [BookingResponse.from_orm(booking) for booking in bookings]

    def update_booking(self, booking_id: int, booking_update: BookingUpdate) -> BookingResponse:
        """
        Update booking information with validation

        Args:
            booking_id: Booking ID to update
            booking_update: Update data

        Returns:
            BookingResponse with updated booking data

        Raises:
            HTTPException: If booking not found or validation fails
        """
        booking = self.repo.get(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        # Validate boat capacity if participants changed
        if booking_update.participants:
            boat = self.db.query(Boat).filter(Boat.id == booking.boat_id).first()
            if booking_update.participants > boat.capacity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Boat capacity ({boat.capacity}) is less than participants ({booking_update.participants})",
                )
            booking.participants = booking_update.participants

        # Validate time slot if dates changed
        if booking_update.start_date or booking_update.end_date:
            new_start = booking_update.start_date or booking.start_date
            new_end = booking_update.end_date or booking.end_date

            overlapping = self.repo.get_overlapping(
                boat_id=booking.boat_id,
                start_date=new_start,
                end_date=new_end,
                exclude_booking_id=booking_id,
            )
            if overlapping:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Boat is not available for the requested time period",
                )

            booking.start_date = new_start
            booking.end_date = new_end

        # Validate captain if changed
        if booking_update.captain_id is not None:
            if booking_update.captain_id:
                captain = self.db.query(Captain).filter(Captain.id == booking_update.captain_id).first()
                if not captain:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Captain not found",
                    )

                from app.repositories.captain_repo import CaptainRepository
                captain_repo = CaptainRepository(self.db)
                if not captain_repo.can_operate_boat(booking_update.captain_id, booking.boat_id):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Captain is not qualified to operate this boat",
                    )

            booking.captain_id = booking_update.captain_id

        # Update other fields
        if booking_update.boat_id:
            booking.boat_id = booking_update.boat_id

        if booking_update.customer_name:
            booking.customer_name = booking_update.customer_name

        if booking_update.customer_email:
            booking.customer_email = booking_update.customer_email

        if booking_update.customer_phone:
            booking.customer_phone = booking_update.customer_phone

        if booking_update.status:
            booking.status = booking_update.status

        if booking_update.notes is not None:
            booking.notes = booking_update.notes

        updated_booking = self.repo.update(booking)
        return BookingResponse.from_orm(updated_booking)

    def delete_booking(self, booking_id: int) -> bool:
        """
        Soft delete a booking (sets status to CANCELLED)

        Args:
            booking_id: Booking ID to delete

        Returns:
            True if deleted, False if not found

        Raises:
            HTTPException: If booking not found
        """
        booking = self.repo.get(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        booking.status = BookingStatus.CANCELLED
        self.repo.update(booking)
        return True

    def check_availability(
        self,
        boat_id: int,
        start_date: datetime,
        end_date: datetime,
        participants: Optional[int] = None,
    ) -> dict:
        """
        Check boat availability for a time period

        Args:
            boat_id: Boat ID
            start_date: Start date
            end_date: End date
            participants: Optional participant count for capacity check

        Returns:
            Dictionary with availability information
        """
        boat = self.db.query(Boat).filter(Boat.id == boat_id).first()
        if not boat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Boat not found",
            )

        # Check for overlapping bookings
        overlapping = self.repo.get_overlapping(
            boat_id=boat_id,
            start_date=start_date,
            end_date=end_date,
        )

        # Check capacity if participants provided
        capacity_ok = True
        if participants and participants > boat.capacity:
            capacity_ok = False

        is_available = len(overlapping) == 0 and capacity_ok

        return {
            "is_available": is_available,
            "boat_id": boat_id,
            "start_date": start_date,
            "end_date": end_date,
            "reason": None if is_available else "Boat is not available for the requested period",
        }
