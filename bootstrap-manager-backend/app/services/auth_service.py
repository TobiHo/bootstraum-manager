"""Authentication service with password hashing and JWT token management"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.config import settings


# Password hashing configuration
password_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="bcrypt",
)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password
    """
    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to check against

    Returns:
        True if password matches, False otherwise
    """
    return password_context.verify(plain_password, hashed_password)


def _create_token(
    data: Dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT token with expiration

    Args:
        data: Data to encode in token
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    return encoded_jwt


def create_tokens(user_id: int, email: str) -> Tuple[str, str]:
    """
    Create access and refresh tokens for a user

    Args:
        user_id: User ID to encode in token
        email: User email to encode in token

    Returns:
        Tuple of (access_token, refresh_token)
    """
    # Create access token
    access_token_expires = timedelta(
        minutes=settings.access_token_expire_minutes
    )
    access_token = _create_token(
        data={"sub": str(user_id), "email": email},
        expires_delta=access_token_expires,
    )

    # Create refresh token
    refresh_token_expires = timedelta(
        days=settings.refresh_token_expire_days
    )
    refresh_token = _create_token(
        data={"sub": str(user_id), "email": email, "type": "refresh"},
        expires_delta=refresh_token_expires,
    )

    return access_token, refresh_token


def verify_token(token: str) -> Optional[Dict]:
    """
    Verify and decode a JWT token

    Args:
        token: JWT token to verify

    Returns:
        Decoded token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        return None
