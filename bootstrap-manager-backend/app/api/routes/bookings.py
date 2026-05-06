"""Booking API routes"""

from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    BookingAvailabilityCheck,
    AvailabilityResponse,
)
from app.services.booking_service import BookingService
from app.services.notification_service import NotificationService
from app.middleware.auth import get_current_user, get_staff_user
from app.models.db import User
from app.domain.booking import BookingStatus

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("", response_model=List[BookingResponse])
def list_bookings(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[BookingStatus] = None,
    boat_id: Optional[int] = None,
    captain_id: Optional[int] = None,
    db: Session = Depends(get_db),
    staff_user: User = Depends(get_staff_user),
):
    """
    Get all bookings with optional filters (staff+)

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status_filter: Optional booking status to filter by
        boat_id: Optional boat ID to filter by
        captain_id: Optional captain ID to filter by
        db: Database session
        staff_user: Current staff/admin user

    Returns:
        List of BookingResponse objects
    """
    booking_service = BookingService(db)
    return booking_service.get_all_bookings(
        skip=skip,
        limit=limit,
        status=status_filter,
        boat_id=boat_id,
        captain_id=captain_id,
    )


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_create: BookingCreate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(get_staff_user),
):
    """
    Create a new booking (staff+)

    Args:
        booking_create: Booking creation data
        db: Database session
        staff_user: Current staff/admin user

    Returns:
        BookingResponse with created booking data
    """
    booking_service = BookingService(db)
    return booking_service.create_booking(booking_create, staff_user.id)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    staff_user: User = Depends(get_staff_user),
):
    """
    Get booking by ID (staff+)

    Args:
        booking_id: Booking ID
        db: Database session
        staff_user: Current staff/admin user

    Returns:
        BookingResponse with booking data
    """
    booking_service = BookingService(db)
    booking = booking_service.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking


@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    booking_update: BookingUpdate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(get_staff_user),
):
    """
    Update booking information (staff+)

    Args:
        booking_id: Booking ID to update
        booking_update: Update data
        db: Database session
        staff_user: Current staff/admin user

    Returns:
        BookingResponse with updated booking data
    """
    booking_service = BookingService(db)
    return booking_service.update_booking(booking_id, booking_update)


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    staff_user: User = Depends(get_staff_user),
):
    """
    Soft delete a booking (staff+)

    Args:
        booking_id: Booking ID to delete
        db: Database session
        staff_user: Current staff/admin user
    """
    booking_service = BookingService(db)
    booking_service.delete_booking(booking_id)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    staff_user: User = Depends(get_staff_user),
):
    """
    Cancel a booking and notify captain & customer via email/WhatsApp (staff+)

    Args:
        booking_id: Booking ID to cancel
        db: Database session
        staff_user: Current staff/admin user

    Returns:
        BookingResponse with cancelled booking data
    """
    booking_service = BookingService(db)
    booking = booking_service.cancel_booking(booking_id)

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # Send notifications
    notification_service = NotificationService()
    notification_service.send_cancellation_notification(booking)

    return booking


@router.post("/check-availability", response_model=AvailabilityResponse)
def check_availability(
    availability_check: BookingAvailabilityCheck,
    db: Session = Depends(get_db),
):
    """
    Check boat and captain availability for a time period

    Args:
        availability_check: Availability check data
        db: Database session

    Returns:
        AvailabilityResponse with availability information
    """
    booking_service = BookingService(db)
    return booking_service.check_availability(
        boat_id=availability_check.boat_id,
        start_date=availability_check.start_date,
        end_date=availability_check.end_date,
        participants=availability_check.participants,
    )
