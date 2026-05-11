"""Aggregate report endpoints (admin/staff only)."""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.middleware.auth import get_staff_user
from app.models.db import (
    Booking,
    PublicTour,
    TourType,
    Boat,
    Captain,
    User,
    CaptainAbsence,
)
from app.domain.booking import BookingStatus

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _filters_query(
    db: Session,
    from_date: Optional[datetime],
    to_date: Optional[datetime],
    boat_id: Optional[int],
    captain_id: Optional[int],
    tour_type_id: Optional[int],
    payment_method: Optional[str],
):
    q = db.query(Booking).filter(Booking.status != BookingStatus.CANCELLED)
    if from_date:
        q = q.filter(Booking.start_date >= from_date)
    if to_date:
        q = q.filter(Booking.start_date <= to_date)
    if boat_id:
        q = q.filter(Booking.boat_id == boat_id)
    if captain_id:
        q = q.filter(Booking.captain_id == captain_id)
    if payment_method == "online":
        q = q.filter(Booking.payment_status.in_(["paid", "unpaid"]))
    elif payment_method == "onsite":
        q = q.filter(Booking.payment_status == "pay_on_site")
    if tour_type_id:
        # join via public_tour or by string match - use public_tour_id when present
        q = q.outerjoin(PublicTour, Booking.public_tour_id == PublicTour.id).filter(
            PublicTour.tour_type_id == tour_type_id
        )
    return q


def _common_params(
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    boat_id: Optional[int] = None,
    captain_id: Optional[int] = None,
    tour_type_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    return dict(
        from_date=from_date,
        to_date=to_date,
        boat_id=boat_id,
        captain_id=captain_id,
        tour_type_id=tour_type_id,
        payment_method=payment_method,
    )


@router.get("/finance")
def finance_report(
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
    params: dict = Depends(_common_params),
):
    bookings = _filters_query(db, **params).all()
    total_revenue = sum(b.total_price or 0 for b in bookings)
    paid = sum(b.total_price or 0 for b in bookings if b.payment_status == "paid")
    onsite = sum(b.total_price or 0 for b in bookings if b.payment_status == "pay_on_site")
    unpaid = sum(b.total_price or 0 for b in bookings if b.payment_status == "unpaid")

    by_month: Dict[str, float] = defaultdict(float)
    for b in bookings:
        key = b.start_date.strftime("%Y-%m")
        by_month[key] += b.total_price or 0

    by_kind: Dict[str, float] = defaultdict(float)
    for b in bookings:
        by_kind[b.booking_kind or "charter"] += b.total_price or 0

    by_payment = {"paid": paid, "onsite": onsite, "unpaid": unpaid}

    return {
        "total_revenue": total_revenue,
        "booking_count": len(bookings),
        "by_month": [{"month": k, "revenue": v} for k, v in sorted(by_month.items())],
        "by_kind": [{"kind": k, "revenue": v} for k, v in by_kind.items()],
        "by_payment": by_payment,
    }


@router.get("/tours")
def tours_report(
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
    params: dict = Depends(_common_params),
):
    bookings = _filters_query(db, **params).all()
    tour_types = {tt.id: tt for tt in db.query(TourType).all()}

    by_type: Dict[str, Dict[str, Any]] = {}
    for b in bookings:
        name = b.tour_type or "Charter"
        e = by_type.setdefault(name, {"name": name, "bookings": 0, "tickets": 0, "revenue": 0.0})
        e["bookings"] += 1
        e["tickets"] += b.participants
        e["revenue"] += b.total_price or 0

    # public tour utilization
    pq = db.query(PublicTour)
    if params["from_date"]:
        pq = pq.filter(PublicTour.start_date >= params["from_date"])
    if params["to_date"]:
        pq = pq.filter(PublicTour.start_date <= params["to_date"])
    if params["boat_id"]:
        pq = pq.filter(PublicTour.boat_id == params["boat_id"])
    if params["captain_id"]:
        pq = pq.filter(PublicTour.captain_id == params["captain_id"])
    if params["tour_type_id"]:
        pq = pq.filter(PublicTour.tour_type_id == params["tour_type_id"])
    public_tours = pq.all()
    total_seats = sum(p.seats_total for p in public_tours)
    booked_seats = sum(p.seats_booked for p in public_tours)
    cancelled = sum(1 for p in public_tours if p.status == "cancelled")
    utilization = (booked_seats / total_seats * 100) if total_seats else 0.0

    return {
        "by_type": list(by_type.values()),
        "public_tours_total": len(public_tours),
        "public_tours_cancelled": cancelled,
        "seats_total": total_seats,
        "seats_booked": booked_seats,
        "seat_utilization_pct": round(utilization, 1),
    }


@router.get("/captains")
def captains_report(
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
    params: dict = Depends(_common_params),
):
    captains = db.query(Captain).all()
    bookings = _filters_query(db, **params).all()

    pq = db.query(PublicTour).filter(PublicTour.status != "cancelled")
    if params["from_date"]:
        pq = pq.filter(PublicTour.start_date >= params["from_date"])
    if params["to_date"]:
        pq = pq.filter(PublicTour.start_date <= params["to_date"])
    if params["boat_id"]:
        pq = pq.filter(PublicTour.boat_id == params["boat_id"])
    if params["captain_id"]:
        pq = pq.filter(PublicTour.captain_id == params["captain_id"])
    public_tours = pq.all()

    # absences in window
    absences = db.query(CaptainAbsence).all()

    by_cap: Dict[int, Dict[str, Any]] = {}
    for c in captains:
        by_cap[c.id] = {
            "captain_id": c.id,
            "name": c.name,
            "bookings": 0,
            "public_tours": 0,
            "hours": 0.0,
            "absences": 0,
        }
    for b in bookings:
        if b.captain_id and b.captain_id in by_cap:
            entry = by_cap[b.captain_id]
            entry["bookings"] += 1
            entry["hours"] += (b.end_date - b.start_date).total_seconds() / 3600
    for p in public_tours:
        if p.captain_id and p.captain_id in by_cap:
            entry = by_cap[p.captain_id]
            entry["public_tours"] += 1
            entry["hours"] += (p.end_date - p.start_date).total_seconds() / 3600
    for a in absences:
        if a.captain_id in by_cap:
            by_cap[a.captain_id]["absences"] += 1

    rows = sorted(by_cap.values(), key=lambda r: -(r["bookings"] + r["public_tours"]))
    return {"rows": rows}


@router.get("/boats")
def boats_report(
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
    params: dict = Depends(_common_params),
):
    boats = db.query(Boat).all()
    bookings = _filters_query(db, **params).all()

    pq = db.query(PublicTour)
    if params["from_date"]:
        pq = pq.filter(PublicTour.start_date >= params["from_date"])
    if params["to_date"]:
        pq = pq.filter(PublicTour.start_date <= params["to_date"])
    if params["boat_id"]:
        pq = pq.filter(PublicTour.boat_id == params["boat_id"])
    public_tours = pq.all()

    by_boat: Dict[int, Dict[str, Any]] = {}
    for boat in boats:
        by_boat[boat.id] = {
            "boat_id": boat.id,
            "name": boat.name,
            "capacity": boat.capacity,
            "bookings": 0,
            "public_tours_active": 0,
            "public_tours_cancelled": 0,
            "seats_total": 0,
            "seats_booked": 0,
            "seat_utilization_pct": 0.0,
            "hours": 0.0,
        }
    for b in bookings:
        if b.boat_id in by_boat:
            entry = by_boat[b.boat_id]
            entry["bookings"] += 1
            entry["hours"] += (b.end_date - b.start_date).total_seconds() / 3600
    for p in public_tours:
        if p.boat_id in by_boat:
            entry = by_boat[p.boat_id]
            if p.status == "cancelled":
                entry["public_tours_cancelled"] += 1
            else:
                entry["public_tours_active"] += 1
                entry["seats_total"] += p.seats_total
                entry["seats_booked"] += p.seats_booked
                entry["hours"] += (p.end_date - p.start_date).total_seconds() / 3600
    for entry in by_boat.values():
        if entry["seats_total"]:
            entry["seat_utilization_pct"] = round(
                entry["seats_booked"] / entry["seats_total"] * 100, 1
            )

    rows = sorted(by_boat.values(), key=lambda r: -(r["bookings"] + r["public_tours_active"]))
    return {"rows": rows}


@router.get("/customers")
def customers_report(
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
    params: dict = Depends(_common_params),
):
    bookings = _filters_query(db, **params).all()
    by_cust: Dict[str, Dict[str, Any]] = {}
    for b in bookings:
        key = b.customer_email.lower()
        e = by_cust.setdefault(key, {
            "name": b.customer_name,
            "email": b.customer_email,
            "bookings": 0,
            "revenue": 0.0,
        })
        e["bookings"] += 1
        e["revenue"] += b.total_price or 0
    rows = sorted(by_cust.values(), key=lambda r: -r["revenue"])[:50]
    return {"rows": rows, "total_customers": len(by_cust)}


def _serialize_booking(b: Booking) -> Dict[str, Any]:
    return {
        "kind": "charter" if (b.booking_kind or "charter") == "charter" else "public",
        "id": b.id,
        "start_date": b.start_date.isoformat(),
        "end_date": b.end_date.isoformat(),
        "boat_id": b.boat_id,
        "captain_id": b.captain_id,
        "tour_type": b.tour_type,
        "customer_name": b.customer_name,
        "customer_email": b.customer_email,
        "participants": b.participants,
        "total_price": b.total_price or 0,
        "payment_status": b.payment_status,
        "status": b.status.value if hasattr(b.status, "value") else b.status,
    }


def _serialize_public_tour(p: PublicTour, tt_name: Optional[str]) -> Dict[str, Any]:
    return {
        "kind": "public_tour",
        "id": p.id,
        "start_date": p.start_date.isoformat(),
        "end_date": p.end_date.isoformat(),
        "boat_id": p.boat_id,
        "captain_id": p.captain_id,
        "tour_type": tt_name,
        "seats_total": p.seats_total,
        "seats_booked": p.seats_booked,
        "status": p.status,
    }


def _group_by_month(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    by_month: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for it in items:
        key = it["start_date"][:7]  # YYYY-MM
        by_month[key].append(it)
    out = []
    for k in sorted(by_month.keys()):
        items_sorted = sorted(by_month[k], key=lambda x: x["start_date"])
        out.append({"month": k, "items": items_sorted})
    return out


@router.get("/captain-schedule")
def captain_schedule(
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
    params: dict = Depends(_common_params),
):
    """Monats-gruppierte Termin-Liste für einen Bootsführer (oder alle)."""
    bookings_q = _filters_query(db, **params)
    bookings = bookings_q.all()

    pq = db.query(PublicTour).filter(PublicTour.status != "cancelled")
    if params["from_date"]:
        pq = pq.filter(PublicTour.start_date >= params["from_date"])
    if params["to_date"]:
        pq = pq.filter(PublicTour.start_date <= params["to_date"])
    if params["boat_id"]:
        pq = pq.filter(PublicTour.boat_id == params["boat_id"])
    if params["captain_id"]:
        pq = pq.filter(PublicTour.captain_id == params["captain_id"])
    if params["tour_type_id"]:
        pq = pq.filter(PublicTour.tour_type_id == params["tour_type_id"])
    public_tours = pq.all()

    tour_types = {tt.id: tt.name for tt in db.query(TourType).all()}
    items: List[Dict[str, Any]] = [_serialize_booking(b) for b in bookings]
    items += [_serialize_public_tour(p, tour_types.get(p.tour_type_id)) for p in public_tours]

    return {"months": _group_by_month(items), "total": len(items)}


@router.get("/boat-schedule")
def boat_schedule(
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
    params: dict = Depends(_common_params),
):
    """Monats-gruppierte Termin-Liste pro Boot (oder alle)."""
    bookings = _filters_query(db, **params).all()

    pq = db.query(PublicTour).filter(PublicTour.status != "cancelled")
    if params["from_date"]:
        pq = pq.filter(PublicTour.start_date >= params["from_date"])
    if params["to_date"]:
        pq = pq.filter(PublicTour.start_date <= params["to_date"])
    if params["boat_id"]:
        pq = pq.filter(PublicTour.boat_id == params["boat_id"])
    if params["captain_id"]:
        pq = pq.filter(PublicTour.captain_id == params["captain_id"])
    if params["tour_type_id"]:
        pq = pq.filter(PublicTour.tour_type_id == params["tour_type_id"])
    public_tours = pq.all()

    tour_types = {tt.id: tt.name for tt in db.query(TourType).all()}
    items: List[Dict[str, Any]] = [_serialize_booking(b) for b in bookings]
    items += [_serialize_public_tour(p, tour_types.get(p.tour_type_id)) for p in public_tours]

    return {"months": _group_by_month(items), "total": len(items)}
