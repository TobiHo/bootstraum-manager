"""Captain API routes"""

from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import (
    CaptainCreate,
    CaptainUpdate,
    CaptainResponse,
    CaptainBoatsUpdate,
)
from app.services.captain_service import CaptainService
from app.middleware.auth import get_admin_user
from app.models.db import User

router = APIRouter(prefix="/api/captains", tags=["captains"])


@router.get("", response_model=List[CaptainResponse])
def list_captains(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Get all captains with pagination

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session

    Returns:
        List of CaptainResponse objects
    """
    captain_service = CaptainService(db)
    return captain_service.get_all_captains(skip=skip, limit=limit)


@router.post("", response_model=CaptainResponse, status_code=status.HTTP_201_CREATED)
def create_captain(
    captain_create: CaptainCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Create a new captain (admin only)

    Args:
        captain_create: Captain creation data
        db: Database session
        admin_user: Current admin user

    Returns:
        CaptainResponse with created captain data
    """
    captain_service = CaptainService(db)
    return captain_service.create_captain(captain_create)


@router.get("/{captain_id}", response_model=CaptainResponse)
def get_captain(
    captain_id: int,
    db: Session = Depends(get_db),
):
    """
    Get captain by ID

    Args:
        captain_id: Captain ID
        db: Database session

    Returns:
        CaptainResponse with captain data
    """
    captain_service = CaptainService(db)
    captain = captain_service.get_captain(captain_id)
    if not captain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Captain not found")
    return captain


@router.put("/{captain_id}", response_model=CaptainResponse)
def update_captain(
    captain_id: int,
    captain_update: CaptainUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Update captain information (admin only)

    Args:
        captain_id: Captain ID to update
        captain_update: Update data
        db: Database session
        admin_user: Current admin user

    Returns:
        CaptainResponse with updated captain data
    """
    captain_service = CaptainService(db)
    return captain_service.update_captain(captain_id, captain_update)


@router.delete("/{captain_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_captain(
    captain_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Delete a captain (admin only)

    Args:
        captain_id: Captain ID to delete
        db: Database session
        admin_user: Current admin user
    """
    captain_service = CaptainService(db)
    captain_service.delete_captain(captain_id)


@router.put("/{captain_id}/boats", response_model=CaptainResponse)
def assign_boats(
    captain_id: int,
    boats_update: CaptainBoatsUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Assign boats to a captain (admin only)

    Args:
        captain_id: Captain ID
        boats_update: Boat IDs to assign
        db: Database session
        admin_user: Current admin user

    Returns:
        CaptainResponse with updated captain data
    """
    captain_service = CaptainService(db)
    return captain_service.assign_boats(captain_id, boats_update.boat_ids)
