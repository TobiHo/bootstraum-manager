"""Public charter request endpoint (no auth required)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.db import Boat, Booking
from app.models.schemas import CharterRequest, BookingResponse
from app.repositories.booking_repo import BookingRepository
from app.services.captain_assignment_service import CaptainAssignmentService
from app.services.user_service import UserService
from app.domain.booking import BookingStatus


def _charter_price(boat_capacity: int, start, end) -> float:
    hours = max(0.0, (end - start).total_seconds() / 3600.0)
    hourly = 240.0 if boat_capacity > 14 else 160.0
    return round(hourly * hours, 2)

router = APIRouter(prefix="/api/public", tags=["public"])


@router.post("/charter", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_public_charter(payload: CharterRequest, db: Session = Depends(get_db)):
    boat = db.query(Boat).filter(Boat.id == payload.boat_id).first()
    if not boat:
        raise HTTPException(404, "Boat not found")
    if payload.participants > boat.capacity:
        raise HTTPException(400, f"Boat capacity ({boat.capacity}) is less than participants")

    repo = BookingRepository(db)
    if repo.get_overlapping(boat_id=payload.boat_id, start_date=payload.start_date, end_date=payload.end_date):
        raise HTTPException(409, "Boat is not available for the requested time period")

    captain_id = CaptainAssignmentService(db).assign(payload.boat_id, payload.start_date, payload.end_date)

    system_user = UserService(db).get_or_create_public_system_user()

    booking = Booking(
        boat_id=payload.boat_id,
        captain_id=captain_id,
        created_by_id=system_user.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        participants=payload.participants,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        tour_type=payload.tour_type or "Charter",
        status=BookingStatus.PENDING,
        notes=payload.notes,
        catering=payload.catering,
        booking_kind="charter",
        total_price=_charter_price(boat.capacity, payload.start_date, payload.end_date),
        payment_status=("pay_on_site" if payload.payment_method == "onsite" else "unpaid"),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking
