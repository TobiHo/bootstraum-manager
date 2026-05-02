"""Base repository with generic CRUD operations"""

from typing import TypeVar, Generic, Type, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """Generic repository for basic CRUD operations"""

    def __init__(self, db: Session, model: Type[ModelType]):
        """
        Initialize repository

        Args:
            db: SQLAlchemy session
            model: ORM model class
        """
        self.db = db
        self.model = model

    def create(self, obj_in: ModelType) -> ModelType:
        """
        Create a new object

        Args:
            obj_in: Object to create

        Returns:
            Created object
        """
        self.db.add(obj_in)
        self.db.commit()
        self.db.refresh(obj_in)
        return obj_in

    def get(self, id: int) -> Optional[ModelType]:
        """
        Get object by ID

        Args:
            id: Object ID

        Returns:
            Object if found, None otherwise
        """
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        Get all objects with pagination

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of objects
        """
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def update(self, obj_in: ModelType) -> ModelType:
        """
        Update an object

        Args:
            obj_in: Object with updated data

        Returns:
            Updated object
        """
        self.db.merge(obj_in)
        self.db.commit()
        self.db.refresh(obj_in)
        return obj_in

    def delete(self, id: int) -> bool:
        """
        Delete an object by ID

        Args:
            id: Object ID

        Returns:
            True if deleted, False if not found
        """
        obj = self.get(id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            return True
        return False

    def count(self) -> int:
        """
        Count total number of objects

        Returns:
            Total count
        """
        return self.db.query(func.count(self.model.id)).scalar()
