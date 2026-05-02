"""SQLAlchemy database engine and session configuration"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Create SQLAlchemy engine
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base class for ORM models
Base = declarative_base()


def get_db():
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
