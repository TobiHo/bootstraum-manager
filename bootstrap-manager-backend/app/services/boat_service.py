"""Boat business logic service"""

from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.db import Boat
from app.models.schemas import BoatCreate, BoatUpdate, BoatResponse
from app.repositories.boat_repo import BoatRepository


class BoatService:
    """Service for boat business logic"""

    def __init__(self, db: Session):
        """
        Initialize boat service

        Args:
            db: SQLAlchemy session
        """
        self.db = db
        self.repo = BoatRepository(db)

    def create_boat(self, boat_in: BoatCreate) -> BoatResponse:
        """
        Create a new boat

        Args:
            boat_in: Boat creation data

        Returns:
            BoatResponse with created boat data

        Raises:
            HTTPException: If boat name already exists
        """
        # Check if boat name already exists
        if self.repo.get_by_name(boat_in.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Boat name already exists",
            )

        boat = Boat(
            name=boat_in.name,
            capacity=boat_in.capacity,
            boat_type=boat_in.boat_type,
            description=boat_in.description,
            available=boat_in.available,
        )

        created_boat = self.repo.create(boat)
        return BoatResponse.from_orm(created_boat)

    def get_boat(self, boat_id: int) -> Optional[BoatResponse]:
        """
        Get boat by ID

        Args:
            boat_id: Boat ID

        Returns:
            BoatResponse if found, None otherwise
        """
        boat = self.repo.get(boat_id)
        if not boat:
            return None
        return BoatResponse.from_orm(boat)

    def get_all_boats(self, skip: int = 0, limit: int = 100) -> List[BoatResponse]:
        """
        Get all boats with pagination

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of BoatResponse objects
        """
        boats = self.repo.get_all(skip=skip, limit=limit)
        return [BoatResponse.from_orm(boat) for boat in boats]

    def update_boat(self, boat_id: int, boat_update: BoatUpdate) -> BoatResponse:
        """
        Update boat information

        Args:
            boat_id: Boat ID to update
            boat_update: Update data

        Returns:
            BoatResponse with updated boat data

        Raises:
            HTTPException: If boat not found or name already exists
        """
        boat = self.repo.get(boat_id)
        if not boat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Boat not found",
            )

        # Check if new name already exists (and is different from current)
        if boat_update.name and boat_update.name != boat.name:
            if self.repo.get_by_name(boat_update.name):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Boat name already exists",
                )
            boat.name = boat_update.name

        if boat_update.capacity is not None:
            boat.capacity = boat_update.capacity

        if boat_update.boat_type:
            boat.boat_type = boat_update.boat_type

        if boat_update.description is not None:
            boat.description = boat_update.description

        if boat_update.available is not None:
            boat.available = boat_update.available

        updated_boat = self.repo.update(boat)
        return BoatResponse.from_orm(updated_boat)

    def delete_boat(self, boat_id: int) -> bool:
        """
        Delete a boat by ID

        Args:
            boat_id: Boat ID to delete

        Returns:
            True if deleted, False if not found

        Raises:
            HTTPException: If boat not found
        """
        boat = self.repo.get(boat_id)
        if not boat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Boat not found",
            )

        return self.repo.delete(boat_id)
