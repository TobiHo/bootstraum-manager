"""Captain business logic service"""

from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.db import Captain
from app.models.schemas import CaptainCreate, CaptainUpdate, CaptainResponse
from app.repositories.captain_repo import CaptainRepository


class CaptainService:
    """Service for captain business logic"""

    def __init__(self, db: Session):
        """
        Initialize captain service

        Args:
            db: SQLAlchemy session
        """
        self.db = db
        self.repo = CaptainRepository(db)

    def create_captain(self, captain_in: CaptainCreate) -> CaptainResponse:
        """
        Create a new captain

        Args:
            captain_in: Captain creation data

        Returns:
            CaptainResponse with created captain data

        Raises:
            HTTPException: If email already exists
        """
        # Check if email already exists
        if self.repo.get_by_email(captain_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Captain email already exists",
            )

        captain = Captain(
            name=captain_in.name,
            email=captain_in.email,
            phone=captain_in.phone,
            certifications=captain_in.certifications,
        )

        created_captain = self.repo.create(captain)
        return CaptainResponse.from_orm(created_captain)

    def get_captain(self, captain_id: int) -> Optional[CaptainResponse]:
        """
        Get captain by ID

        Args:
            captain_id: Captain ID

        Returns:
            CaptainResponse if found, None otherwise
        """
        captain = self.repo.get(captain_id)
        if not captain:
            return None
        return CaptainResponse.from_orm(captain)

    def get_all_captains(self, skip: int = 0, limit: int = 100) -> List[CaptainResponse]:
        """
        Get all captains with pagination

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of CaptainResponse objects
        """
        captains = self.repo.get_all(skip=skip, limit=limit)
        return [CaptainResponse.from_orm(captain) for captain in captains]

    def update_captain(self, captain_id: int, captain_update: CaptainUpdate) -> CaptainResponse:
        """
        Update captain information

        Args:
            captain_id: Captain ID to update
            captain_update: Update data

        Returns:
            CaptainResponse with updated captain data

        Raises:
            HTTPException: If captain not found or email already exists
        """
        captain = self.repo.get(captain_id)
        if not captain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Captain not found",
            )

        # Check if new email already exists (and is different from current)
        if captain_update.email and captain_update.email != captain.email:
            if self.repo.get_by_email(captain_update.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use",
                )
            captain.email = captain_update.email

        if captain_update.name:
            captain.name = captain_update.name

        if captain_update.phone:
            captain.phone = captain_update.phone

        if captain_update.certifications is not None:
            captain.certifications = captain_update.certifications

        updated_captain = self.repo.update(captain)
        return CaptainResponse.from_orm(updated_captain)

    def delete_captain(self, captain_id: int) -> bool:
        """
        Delete a captain by ID

        Args:
            captain_id: Captain ID to delete

        Returns:
            True if deleted, False if not found

        Raises:
            HTTPException: If captain not found
        """
        captain = self.repo.get(captain_id)
        if not captain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Captain not found",
            )

        return self.repo.delete(captain_id)

    def assign_boats(self, captain_id: int, boat_ids: List[int]) -> CaptainResponse:
        """
        Assign boats to a captain

        Args:
            captain_id: Captain ID
            boat_ids: List of boat IDs to assign

        Returns:
            CaptainResponse with updated captain data

        Raises:
            HTTPException: If captain not found
        """
        captain = self.repo.get(captain_id)
        if not captain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Captain not found",
            )

        if not self.repo.assign_boats(captain_id, boat_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to assign boats",
            )

        # Refresh captain to get updated boats
        self.db.refresh(captain)
        return CaptainResponse.from_orm(captain)

    def can_operate_boat(self, captain_id: int, boat_id: int) -> bool:
        """
        Check if a captain can operate a specific boat

        Args:
            captain_id: Captain ID
            boat_id: Boat ID

        Returns:
            True if captain can operate boat, False otherwise
        """
        return self.repo.can_operate_boat(captain_id, boat_id)
