"""Public tours (scheduled slots with seat-based ticketing)."""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.db import PublicTour, TourType, Boat, Booking, User
from app.models.schemas import (
    PublicTourCreate,
    PublicTourUpdate,
    PublicTourCancel,
    PublicTourSeriesCreate,
    PublicTourResponse,
    TicketPurchase,
    BookingResponse,
)
from app.middleware.auth import get_staff_user, get_current_user
from app.services.captain_assignment_service import CaptainAssignmentService
from app.domain.booking import BookingStatus
from app.models.db import Captain, CaptainAbsence

router = APIRouter(prefix="/api/public-tours", tags=["public-tours"])


@router.get("", response_model=List[PublicTourResponse])
def list_public_tours(
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    tour_type_id: Optional[int] = None,
    boat_id: Optional[int] = None,
    captain_id: Optional[int] = None,
    category: Optional[str] = None,  # rundfahrt | event
    status_filter: Optional[str] = Query(None, alias="status"),
    include_cancelled: bool = False,
    only_available: bool = False,
    db: Session = Depends(get_db),
):
    q = db.query(PublicTour)
    if status_filter:
        q = q.filter(PublicTour.status == status_filter)
    elif not include_cancelled:
        q = q.filter(PublicTour.status == "scheduled")
    if from_date:
        q = q.filter(PublicTour.end_date >= from_date)
    if to_date:
        q = q.filter(PublicTour.start_date <= to_date)
    if tour_type_id:
        q = q.filter(PublicTour.tour_type_id == tour_type_id)
    if boat_id:
        q = q.filter(PublicTour.boat_id == boat_id)
    if captain_id:
        q = q.filter(PublicTour.captain_id == captain_id)
    if category:
        q = q.join(TourType, TourType.id == PublicTour.tour_type_id).filter(TourType.category == category)
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


@router.delete("/purge", status_code=status.HTTP_200_OK)
def purge_public_tours(
    category: Optional[str] = Query(None, description="rundfahrt | event; omit to purge all"),
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    """Hard-delete all public tours (and their public bookings). Optionally filter by tour-type category."""
    q = db.query(PublicTour)
    if category:
        q = q.join(TourType, TourType.id == PublicTour.tour_type_id).filter(TourType.category == category)
    tours = q.all()
    ids = [t.id for t in tours]
    deleted_bookings = 0
    if ids:
        deleted_bookings = db.query(Booking).filter(Booking.public_tour_id.in_(ids)).delete(synchronize_session=False)
        for t in tours:
            db.delete(t)
    db.commit()
    return {"deleted_tours": len(ids), "deleted_bookings": deleted_bookings}


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


@router.patch("/{public_tour_id}", response_model=PublicTourResponse)
def update_public_tour(
    public_tour_id: int,
    payload: PublicTourUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    pt = db.query(PublicTour).filter(PublicTour.id == public_tour_id).first()
    if not pt:
        raise HTTPException(404, "Not found")
    data = payload.dict(exclude_unset=True)
    if "boat_id" in data and data["boat_id"]:
        boat = db.query(Boat).filter(Boat.id == data["boat_id"]).first()
        if not boat:
            raise HTTPException(404, "Boat not found")
        if (data.get("seats_total") or pt.seats_total) > boat.capacity:
            raise HTTPException(400, f"seats_total exceeds boat capacity ({boat.capacity})")
    for k, v in data.items():
        setattr(pt, k, v)
    db.commit()
    db.refresh(pt)
    return pt


@router.post("/{public_tour_id}/cancel", response_model=PublicTourResponse)
def cancel_with_reason(
    public_tour_id: int,
    payload: PublicTourCancel,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    pt = db.query(PublicTour).filter(PublicTour.id == public_tour_id).first()
    if not pt:
        raise HTTPException(404, "Not found")
    pt.status = "cancelled"
    pt.cancellation_reason = payload.reason
    db.commit()
    db.refresh(pt)
    return pt


@router.post("/series", response_model=List[PublicTourResponse], status_code=status.HTTP_201_CREATED)
def create_series(
    payload: PublicTourSeriesCreate,
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

    times = []
    for t in payload.times:
        try:
            hh, mm = t.split(":")
            times.append((int(hh), int(mm)))
        except Exception:
            raise HTTPException(400, f"Invalid time format: {t}")

    # Pre-load all captains and their absences for in-memory balanced assignment.
    all_captains: List[Captain] = db.query(Captain).order_by(Captain.id).all()
    absences = db.query(CaptainAbsence).all()
    absences_by_cap: dict = {}
    for a in absences:
        absences_by_cap.setdefault(a.captain_id, []).append((a.start_date, a.end_date))

    # Track per-captain counters across this series for balanced distribution.
    weekday_count = {c.id: 0 for c in all_captains}
    weekend_count = {c.id: 0 for c in all_captains}
    # Track in-memory bookings per captain (start, end) to avoid conflicts within series.
    series_slots: dict = {c.id: [] for c in all_captains}

    def is_absent(cap_id: int, start_dt: datetime, end_dt: datetime) -> bool:
        for s, e in absences_by_cap.get(cap_id, []):
            if s < end_dt and e > start_dt:
                return True
        return False

    def has_conflict(cap_id: int, start_dt: datetime, end_dt: datetime) -> bool:
        # in-memory series conflicts
        for s, e in series_slots[cap_id]:
            if s < end_dt and e > start_dt:
                return True
        # existing bookings
        b = db.query(Booking).filter(
            Booking.captain_id == cap_id,
            Booking.start_date < end_dt,
            Booking.end_date > start_dt,
            Booking.status != BookingStatus.CANCELLED,
        ).first()
        if b:
            return True
        # existing public tours
        p = db.query(PublicTour).filter(
            PublicTour.captain_id == cap_id,
            PublicTour.start_date < end_dt,
            PublicTour.end_date > start_dt,
            PublicTour.status != "cancelled",
        ).first()
        return bool(p)

    def pick_captain(start_dt: datetime, end_dt: datetime) -> Optional[int]:
        is_weekend = start_dt.weekday() >= 5
        bucket = weekend_count if is_weekend else weekday_count
        candidates = [
            c for c in all_captains
            if not is_absent(c.id, start_dt, end_dt) and not has_conflict(c.id, start_dt, end_dt)
        ]
        if not candidates:
            return None
        # Sort: lowest bucket count, then lowest total, then id (stable rotation)
        candidates.sort(key=lambda c: (bucket[c.id], weekday_count[c.id] + weekend_count[c.id], c.id))
        return candidates[0].id

    created: List[PublicTour] = []
    day = payload.series_start.date()
    end_day = payload.series_end.date()
    while day <= end_day:
        if payload.weekdays is None or day.weekday() in payload.weekdays:
            for hh, mm in times:
                start_dt = datetime(day.year, day.month, day.day, hh, mm)
                end_dt = start_dt + timedelta(minutes=payload.duration_minutes)
                # skip duplicates on same boat+start
                exists = db.query(PublicTour).filter(
                    PublicTour.boat_id == payload.boat_id,
                    PublicTour.start_date == start_dt,
                ).first()
                if exists:
                    continue
                if payload.captain_id:
                    cap_id = payload.captain_id
                else:
                    cap_id = pick_captain(start_dt, end_dt)
                if cap_id is not None:
                    series_slots.setdefault(cap_id, []).append((start_dt, end_dt))
                    if start_dt.weekday() >= 5:
                        weekend_count[cap_id] = weekend_count.get(cap_id, 0) + 1
                    else:
                        weekday_count[cap_id] = weekday_count.get(cap_id, 0) + 1
                pt = PublicTour(
                    tour_type_id=payload.tour_type_id,
                    boat_id=payload.boat_id,
                    captain_id=cap_id,
                    start_date=start_dt,
                    end_date=end_dt,
                    seats_total=payload.seats_total,
                )
                db.add(pt)
                created.append(pt)
        day += timedelta(days=1)
    db.commit()
    for pt in created:
        db.refresh(pt)
    return created




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

    # Find or create a system "public-bookings" user as creator (created_by_id required NOT NULL).
    # Keep the old lookup for existing production data, but create only with a valid public domain.
    system_user = db.query(User).filter(User.email.in_(["system@vechte.local", "system@vvv-nordhorn.de"])).first()
    if not system_user:
        from app.services.user_service import UserService
        from app.models.schemas import UserCreate
        system_user = UserService(db).register(UserCreate(
            email="system@vvv-nordhorn.de", password="system-not-loginable-1234",
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
        payment_status=("pay_on_site" if payload.payment_method == "onsite" else "unpaid"),
        public_tour_id=pt.id,
    )
    db.add(booking)
    pt.seats_booked = pt.seats_booked + payload.quantity
    db.commit()
    db.refresh(booking)
    return booking
