"""User business logic service"""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.db import User
from app.models.schemas import UserCreate, UserUpdate, UserResponse
from app.repositories.user_repo import UserRepository
from app.services.auth_service import hash_password, verify_password
from app.domain.user import UserRole


class UserService:
    """Service for user business logic"""

    PUBLIC_SYSTEM_EMAIL = "system@vvv-nordhorn.de"
    LEGACY_PUBLIC_SYSTEM_EMAIL = "system@vechte.local"

    def __init__(self, db: Session):
        """
        Initialize user service

        Args:
            db: SQLAlchemy session
        """
        self.db = db
        self.repo = UserRepository(db)

    def register(self, user_in: UserCreate) -> UserResponse:
        """
        Register a new user

        Args:
            user_in: User registration data

        Returns:
            UserResponse with created user data

        Raises:
            HTTPException: If email already exists
        """
        # Check if email already exists
        if self.repo.email_exists(user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create new user with hashed password
        hashed_password = hash_password(user_in.password)
        user = User(
            email=user_in.email,
            password_hash=hashed_password,
            name=user_in.name,
            role=user_in.role,
        )

        created_user = self.repo.create(user)
        return UserResponse.from_orm(created_user)

    def get_or_create_public_system_user(self) -> User:
        """Return the internal creator user for unauthenticated public bookings."""
        user = (
            self.db.query(User)
            .filter(User.email.in_([self.LEGACY_PUBLIC_SYSTEM_EMAIL, self.PUBLIC_SYSTEM_EMAIL]))
            .first()
        )
        if user:
            return user

        system_user = User(
            email=self.PUBLIC_SYSTEM_EMAIL,
            password_hash=hash_password("system-not-loginable-1234"),
            name="System (Public Bookings)",
            role=UserRole.CUSTOMER,
        )
        return self.repo.create(system_user)

    def authenticate(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate user by email and password

        Args:
            email: User email
            password: Plain text password

        Returns:
            User if authentication successful, None otherwise
        """
        user = self.repo.get_by_email(email)
        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    def get_user(self, user_id: int) -> Optional[User]:
        """
        Get user by ID

        Args:
            user_id: User ID

        Returns:
            User if found, None otherwise
        """
        return self.repo.get(user_id)

    def update_user(self, user_id: int, user_update: UserUpdate) -> UserResponse:
        """
        Update user information

        Args:
            user_id: User ID to update
            user_update: Update data

        Returns:
            UserResponse with updated user data

        Raises:
            HTTPException: If user not found or email already exists
        """
        user = self.repo.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Check if new email already exists
        if user_update.email and user_update.email != user.email:
            if self.repo.email_exists(user_update.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use",
                )
            user.email = user_update.email

        if user_update.name:
            user.name = user_update.name

        if user_update.password:
            user.password_hash = hash_password(user_update.password)

        updated_user = self.repo.update(user)
        return UserResponse.from_orm(updated_user)
