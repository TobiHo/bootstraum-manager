"""Public tours (scheduled slots with seat-based ticketing)."""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.db import PublicTour, TourType, Boat, Booking, User
from app.models.schemas import (
    PublicTourCreate,
    PublicTourResponse,
    TicketPurchase,
    BookingResponse,
)
from app.middleware.auth import get_staff_user, get_current_user
from app.services.captain_assignment_service import CaptainAssignmentService
from app.domain.booking import BookingStatus

router = APIRouter(prefix="/api/public-tours", tags=["public-tours"])


@router.get("", response_model=List[PublicTourResponse])
def list_public_tours(
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    tour_type_id: Optional[int] = None,
    only_available: bool = False,
    db: Session = Depends(get_db),
):
    q = db.query(PublicTour).filter(PublicTour.status == "scheduled")
    if from_date:
        q = q.filter(PublicTour.end_date >= from_date)
    if to_date:
        q = q.filter(PublicTour.start_date <= to_date)
    if tour_type_id:
        q = q.filter(PublicTour.tour_type_id == tour_type_id)
    tours = q.order_by(PublicTour.start_date).all()
    if only_available:
        tours = [t for t in tours if t.seats_booked < t.seats_total]
    return tours


@router.post("", response_model=PublicTourResponse, status_code=status.HTTP_201_CREATED)
def create_public_tour(
    payload: PublicTourCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    tt = db.query(TourType).filter(TourType.id == payload.tour_type_id).first()
    if not tt:
        raise HTTPException(404, "Tour type not found")
    boat = db.query(Boat).filter(Boat.id == payload.boat_id).first()
    if not boat:
        raise HTTPException(404, "Boat not found")
    if payload.seats_total > boat.capacity:
        raise HTTPException(400, f"seats_total exceeds boat capacity ({boat.capacity})")

    captain_id = payload.captain_id
    if not captain_id:
        captain_id = CaptainAssignmentService(db).assign(
            payload.boat_id, payload.start_date, payload.end_date
        )

    pt = PublicTour(
        tour_type_id=payload.tour_type_id,
        boat_id=payload.boat_id,
        captain_id=captain_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        seats_total=payload.seats_total,
    )
    db.add(pt)
    db.commit()
    db.refresh(pt)
    return pt


@router.delete("/{public_tour_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_public_tour(
    public_tour_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    pt = db.query(PublicTour).filter(PublicTour.id == public_tour_id).first()
    if not pt:
        raise HTTPException(404, "Not found")
    pt.status = "cancelled"
    db.commit()


@router.post("/{public_tour_id}/tickets", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def buy_tickets(
    public_tour_id: int,
    payload: TicketPurchase,
    db: Session = Depends(get_db),
):
    """Public ticket purchase. Creates a booking attached to the public tour."""
    pt = db.query(PublicTour).filter(PublicTour.id == public_tour_id).first()
    if not pt or pt.status != "scheduled":
        raise HTTPException(404, "Public tour not available")
    if pt.seats_booked + payload.quantity > pt.seats_total:
        raise HTTPException(409, "Not enough seats available")

    tt = db.query(TourType).filter(TourType.id == pt.tour_type_id).first()
    total = (tt.price_per_ticket if tt else 0.0) * payload.quantity

    # Find or create a system "public-bookings" user as creator (created_by_id required NOT NULL)
    system_user = db.query(User).filter(User.email == "system@vechte.local").first()
    if not system_user:
        from app.services.user_service import UserService
        from app.models.schemas import UserCreate
        system_user = UserService(db).register(UserCreate(
            email="system@vechte.local", password="system-not-loginable-1234",
            name="System (Public Bookings)", role="customer",
        ))

    booking = Booking(
        boat_id=pt.boat_id,
        captain_id=pt.captain_id,
        created_by_id=system_user.id,
        start_date=pt.start_date,
        end_date=pt.end_date,
        participants=payload.quantity,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        tour_type=(tt.name if tt else None),
        status=BookingStatus.PENDING,
        notes=payload.notes,
        catering=payload.catering,
        booking_kind="public",
        total_price=total,
        payment_status="unpaid",
        public_tour_id=pt.id,
    )
    db.add(booking)
    pt.seats_booked = pt.seats_booked + payload.quantity
    db.commit()
    db.refresh(booking)
    return booking
