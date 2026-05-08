"""Automatic captain assignment service - balances workload across qualified captains."""

from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.db import Captain, Booking, CaptainAbsence, PublicTour
from app.domain.booking import BookingStatus


class CaptainAssignmentService:
    """Picks the most under-utilized qualified, available captain."""

    def __init__(self, db: Session):
        self.db = db

    def _qualified_captains(self, boat_id: int) -> List[Captain]:
        return (
            self.db.query(Captain)
            .filter(Captain.boats.any(id=boat_id))
            .all()
        )

    def _is_available(self, captain: Captain, start: datetime, end: datetime) -> bool:
        # check absences
        absence = (
            self.db.query(CaptainAbsence)
            .filter(
                CaptainAbsence.captain_id == captain.id,
                CaptainAbsence.start_date < end,
                CaptainAbsence.end_date > start,
            )
            .first()
        )
        if absence:
            return False

        # check booking conflicts
        booking = (
            self.db.query(Booking)
            .filter(
                Booking.captain_id == captain.id,
                Booking.start_date < end,
                Booking.end_date > start,
                Booking.status != BookingStatus.CANCELLED,
            )
            .first()
        )
        if booking:
            return False

        # check public tour conflicts
        pt = (
            self.db.query(PublicTour)
            .filter(
                PublicTour.captain_id == captain.id,
                PublicTour.start_date < end,
                PublicTour.end_date > start,
                PublicTour.status != "cancelled",
            )
            .first()
        )
        if pt:
            return False

        return True

    def _workload(self, captain: Captain) -> int:
        """Number of bookings + public tours in last 30 days."""
        since = datetime.utcnow() - timedelta(days=30)
        b = (
            self.db.query(Booking)
            .filter(
                Booking.captain_id == captain.id,
                Booking.start_date >= since,
                Booking.status != BookingStatus.CANCELLED,
            )
            .count()
        )
        p = (
            self.db.query(PublicTour)
            .filter(
                PublicTour.captain_id == captain.id,
                PublicTour.start_date >= since,
                PublicTour.status != "cancelled",
            )
            .count()
        )
        return b + p

    def assign(self, boat_id: int, start: datetime, end: datetime) -> Optional[int]:
        """Return captain_id or None if no captain is available."""
        candidates = [
            c for c in self._qualified_captains(boat_id)
            if self._is_available(c, start, end)
        ]
        if not candidates:
            return None
        candidates.sort(key=lambda c: (self._workload(c), c.id))
        return candidates[0].id
