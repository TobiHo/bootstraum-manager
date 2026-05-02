"""Boat repository"""

from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.db import Boat
from app.repositories.base import BaseRepository


class BoatRepository(BaseRepository[Boat]):
    """Repository for Boat model"""

    def __init__(self, db: Session):
        super().__init__(db, Boat)

    def get_by_name(self, name: str) -> Optional[Boat]:
        """
        Get boat by name

        Args:
            name: Boat name

        Returns:
            Boat if found, None otherwise
        """
        return self.db.query(Boat).filter(Boat.name == name).first()

    def get_available(self, skip: int = 0, limit: int = 100) -> List[Boat]:
        """
        Get all available boats

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of available boats
        """
        return (
            self.db.query(Boat)
            .filter(Boat.available == True)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_capacity(self, min_capacity: int, skip: int = 0, limit: int = 100) -> List[Boat]:
        """
        Get boats with minimum capacity

        Args:
            min_capacity: Minimum required capacity
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of boats matching criteria
        """
        return (
            self.db.query(Boat)
            .filter(Boat.capacity >= min_capacity)
            .offset(skip)
            .limit(limit)
            .all()
        )
