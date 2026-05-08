"""Tour type master data routes."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.db import TourType
from app.models.schemas import TourTypeCreate, TourTypeUpdate, TourTypeResponse
from app.middleware.auth import get_staff_user
from app.models.db import User

router = APIRouter(prefix="/api/tour-types", tags=["tour-types"])


@router.get("", response_model=List[TourTypeResponse])
def list_tour_types(only_active: bool = False, db: Session = Depends(get_db)):
    q = db.query(TourType)
    if only_active:
        q = q.filter(TourType.active == True)  # noqa: E712
    return q.order_by(TourType.name).all()


@router.get("/{tour_type_id}", response_model=TourTypeResponse)
def get_tour_type(tour_type_id: int, db: Session = Depends(get_db)):
    tt = db.query(TourType).filter(TourType.id == tour_type_id).first()
    if not tt:
        raise HTTPException(404, "Tour type not found")
    return tt


@router.get("/by-slug/{slug}", response_model=TourTypeResponse)
def get_tour_type_by_slug(slug: str, db: Session = Depends(get_db)):
    tt = db.query(TourType).filter(TourType.slug == slug).first()
    if not tt:
        raise HTTPException(404, "Tour type not found")
    return tt


@router.post("", response_model=TourTypeResponse, status_code=status.HTTP_201_CREATED)
def create_tour_type(
    payload: TourTypeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    if db.query(TourType).filter(TourType.slug == payload.slug).first():
        raise HTTPException(409, "Slug already exists")
    tt = TourType(**payload.dict())
    db.add(tt)
    db.commit()
    db.refresh(tt)
    return tt


@router.put("/{tour_type_id}", response_model=TourTypeResponse)
def update_tour_type(
    tour_type_id: int,
    payload: TourTypeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    tt = db.query(TourType).filter(TourType.id == tour_type_id).first()
    if not tt:
        raise HTTPException(404, "Tour type not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(tt, field, value)
    db.commit()
    db.refresh(tt)
    return tt


@router.delete("/{tour_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tour_type(
    tour_type_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    tt = db.query(TourType).filter(TourType.id == tour_type_id).first()
    if not tt:
        raise HTTPException(404, "Tour type not found")
    db.delete(tt)
    db.commit()
