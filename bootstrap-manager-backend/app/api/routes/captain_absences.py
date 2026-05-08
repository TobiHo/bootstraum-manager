"""Captain absence management."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.db import CaptainAbsence, Captain, User
from app.models.schemas import CaptainAbsenceCreate, CaptainAbsenceResponse
from app.middleware.auth import get_current_user, get_staff_user
from app.domain.user import UserRole

router = APIRouter(prefix="/api/captains", tags=["captain-absences"])


def _captain_for_user(db: Session, user: User) -> Captain | None:
    return db.query(Captain).filter(Captain.user_id == user.id).first()


@router.get("/me/absences", response_model=List[CaptainAbsenceResponse])
def list_my_absences(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cap = _captain_for_user(db, user)
    if not cap:
        raise HTTPException(404, "No captain profile linked to this user")
    return db.query(CaptainAbsence).filter(CaptainAbsence.captain_id == cap.id).order_by(CaptainAbsence.start_date).all()


@router.post("/me/absences", response_model=CaptainAbsenceResponse, status_code=status.HTTP_201_CREATED)
def create_my_absence(
    payload: CaptainAbsenceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cap = _captain_for_user(db, user)
    if not cap:
        raise HTTPException(404, "No captain profile linked to this user")
    abs_ = CaptainAbsence(captain_id=cap.id, **payload.dict())
    db.add(abs_)
    db.commit()
    db.refresh(abs_)
    return abs_


@router.delete("/me/absences/{absence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_absence(absence_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cap = _captain_for_user(db, user)
    if not cap:
        raise HTTPException(404, "No captain profile linked to this user")
    abs_ = db.query(CaptainAbsence).filter(CaptainAbsence.id == absence_id, CaptainAbsence.captain_id == cap.id).first()
    if not abs_:
        raise HTTPException(404, "Absence not found")
    db.delete(abs_)
    db.commit()


@router.get("/{captain_id}/absences", response_model=List[CaptainAbsenceResponse])
def list_absences(captain_id: int, db: Session = Depends(get_db), _: User = Depends(get_staff_user)):
    return db.query(CaptainAbsence).filter(CaptainAbsence.captain_id == captain_id).order_by(CaptainAbsence.start_date).all()


@router.post("/{captain_id}/absences", response_model=CaptainAbsenceResponse, status_code=status.HTTP_201_CREATED)
def admin_create_absence(
    captain_id: int,
    payload: CaptainAbsenceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    if not db.query(Captain).filter(Captain.id == captain_id).first():
        raise HTTPException(404, "Captain not found")
    abs_ = CaptainAbsence(captain_id=captain_id, **payload.dict())
    db.add(abs_)
    db.commit()
    db.refresh(abs_)
    return abs_


@router.delete("/{captain_id}/absences/{absence_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_absence(captain_id: int, absence_id: int, db: Session = Depends(get_db), _: User = Depends(get_staff_user)):
    abs_ = db.query(CaptainAbsence).filter(CaptainAbsence.id == absence_id, CaptainAbsence.captain_id == captain_id).first()
    if not abs_:
        raise HTTPException(404, "Absence not found")
    db.delete(abs_)
    db.commit()
