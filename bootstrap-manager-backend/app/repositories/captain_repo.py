"""Captain repository"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.db import Captain, Boat, CaptainBoat
from app.repositories.base import BaseRepository


class CaptainRepository(BaseRepository[Captain]):
    """Repository for Captain model"""

    def __init__(self, db: Session):
        super().__init__(db, Captain)

    def get_by_email(self, email: str) -> Optional[Captain]:
        """
        Get captain by email

        Args:
            email: Captain email

        Returns:
            Captain if found, None otherwise
        """
        return self.db.query(Captain).filter(Captain.email == email).first()

    def get_boats(self, captain_id: int) -> List[Boat]:
        """
        Get all boats assigned to a captain

        Args:
            captain_id: Captain ID

        Returns:
            List of boats assigned to the captain
        """
        captain = self.get(captain_id)
        if not captain:
            return []
        return captain.boats

    def assign_boats(self, captain_id: int, boat_ids: List[int]) -> bool:
        """
        Assign boats to a captain

        Args:
            captain_id: Captain ID
            boat_ids: List of boat IDs to assign

        Returns:
            True if successful, False if captain not found
        """
        captain = self.get(captain_id)
        if not captain:
            return False

        # Clear existing boats
        captain.boats.clear()

        # Add new boats
        for boat_id in boat_ids:
            boat = self.db.query(Boat).filter(Boat.id == boat_id).first()
            if boat:
                captain.boats.append(boat)

        self.db.commit()
        return True

    def can_operate_boat(self, captain_id: int, boat_id: int) -> bool:
        """
        Check if a captain can operate a specific boat

        Args:
            captain_id: Captain ID
            boat_id: Boat ID

        Returns:
            True if captain is assigned to boat, False otherwise
        """
        return (
            self.db.query(CaptainBoat)
            .filter(
                and_(
                    CaptainBoat.c.captain_id == captain_id,
                    CaptainBoat.c.boat_id == boat_id,
                )
            )
            .first()
            is not None
        )
