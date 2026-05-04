"""User API routes"""

from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import UserResponse, UserUpdate, UserRoleUpdate
from app.services.user_service import UserService
from app.middleware.auth import get_current_user, get_admin_user
from app.models.db import User

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse with current user data
    """
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update current user profile

    Args:
        user_update: Update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        UserResponse with updated user data
    """
    user_service = UserService(db)
    return user_service.update_user(current_user.id, user_update)


@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Get all users (admin only)

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        admin_user: Current admin user

    Returns:
        List of UserResponse objects
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponse.from_orm(user) for user in users]


@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Update user role (admin only)

    Args:
        user_id: User ID to update
        role_update: New role data
        db: Database session
        admin_user: Current admin user

    Returns:
        UserResponse with updated user data
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return UserResponse.from_orm(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """
    Delete a user (admin only)

    Args:
        user_id: User ID to delete
        db: Database session
        admin_user: Current admin user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(user)
    db.commit()
