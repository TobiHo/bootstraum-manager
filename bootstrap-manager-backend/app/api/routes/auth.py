"""Authentication API routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import UserCreate, TokenResponse, TokenRefresh
from app.services.user_service import UserService
from app.services.auth_service import create_tokens
from app.middleware.auth import get_current_user
from app.models.db import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(
    user_create: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Register a new user

    Args:
        user_create: User creation data
        db: Database session

    Returns:
        TokenResponse with access and refresh tokens
    """
    user_service = UserService(db)

    # Register user
    user = user_service.register(user_create)

    # Create tokens
    access_token, refresh_token = create_tokens(user.id, user.email)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    user_login: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Login user with email and password

    Args:
        email: User email
        password: User password
        db: Database session

    Returns:
        TokenResponse with access and refresh tokens

    Raises:
        HTTPException: If credentials are invalid
    """
    user_service = UserService(db)

    # Authenticate user
    user = user_service.authenticate(user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create tokens
    access_token, refresh_token = create_tokens(user.id, user.email)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    token_refresh: TokenRefresh,
    db: Session = Depends(get_db),
):
    """
    Refresh access token using refresh token

    Args:
        token_refresh: Refresh token data
        db: Database session

    Returns:
        TokenResponse with new access token

    Raises:
        HTTPException: If refresh token is invalid
    """
    from app.services.auth_service import verify_token

    payload = verify_token(token_refresh.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Create new access token
    access_token, new_refresh_token = create_tokens(user.id, user.email)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout user (client clears tokens)

    Args:
        current_user: Current authenticated user

    Returns:
        Success message
    """
    return {"message": "Successfully logged out. Please clear your tokens on the client."}
