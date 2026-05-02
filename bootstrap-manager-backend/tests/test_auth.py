"""Tests for authentication service"""

import pytest
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_tokens,
    verify_token,
)


class TestPasswordHashing:
    """Tests for password hashing and verification"""

    def test_hash_password(self):
        """Test that password hashing works"""
        password = "testpassword123"
        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 0
        assert "$argon2" in hashed or "$2b$" in hashed  # argon2 or bcrypt hash format

    def test_hash_password_different_hashes(self):
        """Test that same password produces different hashes"""
        password = "testpassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        # Different hashes
        assert hash1 != hash2
        # But both verify correctly
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

    def test_verify_password_wrong(self):
        """Test that wrong password fails verification"""
        password = "testpassword123"
        hashed = hash_password(password)

        assert not verify_password("wrongpassword", hashed)
        assert not verify_password("TestPassword123", hashed)  # Case sensitive


class TestTokenCreation:
    """Tests for token creation and verification"""

    def test_create_tokens(self):
        """Test creating access and refresh tokens"""
        user_id = 1
        email = "test@example.com"

        access_token, refresh_token = create_tokens(user_id, email)

        assert access_token is not None
        assert refresh_token is not None
        assert isinstance(access_token, str)
        assert isinstance(refresh_token, str)
        assert len(access_token) > 0
        assert len(refresh_token) > 0

    def test_verify_token(self):
        """Test verifying a valid token"""
        user_id = 1
        email = "test@example.com"

        access_token, _ = create_tokens(user_id, email)
        payload = verify_token(access_token)

        assert payload is not None
        assert payload["sub"] == str(user_id)
        assert payload["email"] == email
        assert "exp" in payload

    def test_verify_invalid_token(self):
        """Test that invalid token returns None"""
        invalid_token = "invalid.token.here"
        payload = verify_token(invalid_token)

        assert payload is None

    def test_verify_expired_token(self):
        """Test that expired token cannot be verified"""
        from datetime import datetime, timedelta, timezone
        from jose import jwt
        from app.config import settings

        # Create an expired token
        expired_data = {
            "sub": "1",
            "email": "test@example.com",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        }
        expired_token = jwt.encode(
            expired_data,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )

        payload = verify_token(expired_token)
        assert payload is None
