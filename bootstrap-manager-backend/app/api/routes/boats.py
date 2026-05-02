"""Boat API routes"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import BoatCreate, BoatUpdate, BoatResponse
from app.services.boat_service import BoatService
from app.middleware.auth import get_admin_user
from app.models.db import User

router = APIRouter(prefix="/api/boats", tags=["boats"])


@router.get("", response_model=List[BoatResponse])
def list_boats(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Get all boats with pagination

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session

    Returns:
        List of BoatResponse objects
    """
    boat_service = BoatService(db)
    return boat_service.get_all_boats(skip=skip, limit=limit)


@router.post("", response_model=BoatResponse, status_code=status.HTTP_201_CREATED)
def create_boat(
    boat_create: BoatCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Create a new boat (admin only)

    Args:
        boat_create: Boat creation data
        db: Database session
        admin_user: Current admin user

    Returns:
        BoatResponse with created boat data
    """
    boat_service = BoatService(db)
    return boat_service.create_boat(boat_create)


@router.get("/{boat_id}", response_model=BoatResponse)
def get_boat(
    boat_id: int,
    db: Session = Depends(get_db),
):
    """
    Get boat by ID

    Args:
        boat_id: Boat ID
        db: Database session

    Returns:
        BoatResponse with boat data
    """
    boat_service = BoatService(db)
    boat = boat_service.get_boat(boat_id)
    if not boat:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Boat not found")
    return boat


@router.put("/{boat_id}", response_model=BoatResponse)
def update_boat(
    boat_id: int,
    boat_update: BoatUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Update boat information (admin only)

    Args:
        boat_id: Boat ID to update
        boat_update: Update data
        db: Database session
        admin_user: Current admin user

    Returns:
        BoatResponse with updated boat data
    """
    boat_service = BoatService(db)
    return boat_service.update_boat(boat_id, boat_update)


@router.delete("/{boat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_boat(
    boat_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Delete a boat (admin only)

    Args:
        boat_id: Boat ID to delete
        db: Database session
        admin_user: Current admin user
    """
    boat_service = BoatService(db)
    boat_service.delete_boat(boat_id)
