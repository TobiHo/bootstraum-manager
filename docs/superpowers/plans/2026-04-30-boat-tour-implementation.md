# Boat Tour Management System - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete boat tour booking system with FastAPI backend, PostgreSQL database, JWT authentication, and React frontend connected to real database.

**Architecture:** Clean architecture backend with separated layers (routes → services → repositories → ORM). PostgreSQL with constraints for data integrity. Frontend uses axios + React Query with JWT interceptors for authentication.

**Tech Stack:** 
- Backend: Python 3.11+, FastAPI, SQLAlchemy, Alembic, python-jose, passlib
- Database: PostgreSQL 12+
- Frontend: React 18, TypeScript, axios, React Query, React Router
- Testing: pytest, pytest-asyncio

---

## Phase 1: Backend Setup

### Task 1: Backend Project Initialization

**Files:**
- Create: `bootstrap-manager-backend/requirements.txt`
- Create: `bootstrap-manager-backend/.env.example`
- Create: `bootstrap-manager-backend/docker-compose.yml`
- Create: `bootstrap-manager-backend/app/__init__.py`
- Create: `bootstrap-manager-backend/app/config.py`

- [ ] **Step 1: Create requirements.txt**

```
cd /Users/tobiho/Documents/git/bootstraum-manager
mkdir -p bootstrap-manager-backend/app
cat > bootstrap-manager-backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
alembic==1.13.0
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.1
EOF
```

- [ ] **Step 2: Create .env.example**

```bash
cat > bootstrap-manager-backend/.env.example << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/boat_tour
POSTGRES_USER=boat_user
POSTGRES_PASSWORD=boat_password
POSTGRES_DB=boat_tour

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Server
DEBUG=True
EOF
```

- [ ] **Step 3: Create docker-compose.yml**

```bash
cat > bootstrap-manager-backend/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-boat_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-boat_password}
      POSTGRES_DB: ${POSTGRES_DB:-boat_tour}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-boat_user}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF
```

- [ ] **Step 4: Create app/config.py**

```bash
cat > bootstrap-manager-backend/app/config.py << 'EOF'
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://boat_user:boat_password@localhost:5432/boat_tour"
    POSTGRES_USER: str = "boat_user"
    POSTGRES_PASSWORD: str = "boat_password"
    POSTGRES_DB: str = "boat_tour"
    
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
EOF
```

- [ ] **Step 5: Create app/__init__.py**

```bash
cat > bootstrap-manager-backend/app/__init__.py << 'EOF'
"""Boat Tour Management System API"""
EOF
```

- [ ] **Step 6: Create .env from example**

```bash
cd bootstrap-manager-backend
cp .env.example .env
```

- [ ] **Step 7: Install dependencies**

```bash
cd bootstrap-manager-backend
pip install -r requirements.txt
```

- [ ] **Step 8: Start PostgreSQL**

```bash
docker-compose up -d
sleep 5
docker-compose ps
```

Expected output: postgres service running, healthy

- [ ] **Step 9: Verify connection**

```bash
psql postgresql://boat_user:boat_password@localhost:5432/boat_tour -c "SELECT 1"
```

Expected: Output showing `1`

- [ ] **Step 10: Commit**

```bash
git add bootstrap-manager-backend/requirements.txt \
        bootstrap-manager-backend/.env.example \
        bootstrap-manager-backend/.env \
        bootstrap-manager-backend/docker-compose.yml \
        bootstrap-manager-backend/app/__init__.py \
        bootstrap-manager-backend/app/config.py
git commit -m "chore: initialize FastAPI backend with PostgreSQL"
```

---

### Task 2: Database Models (SQLAlchemy ORM)

**Files:**
- Create: `bootstrap-manager-backend/app/db/database.py`
- Create: `bootstrap-manager-backend/app/models/db.py`
- Create: `bootstrap-manager-backend/app/domain/__init__.py`
- Create: `bootstrap-manager-backend/app/domain/booking.py`
- Create: `bootstrap-manager-backend/app/domain/user.py`
- Create: `bootstrap-manager-backend/app/models/__init__.py`

- [ ] **Step 1: Create db/database.py**

```bash
cat > bootstrap-manager-backend/app/db/database.py << 'EOF'
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF
```

- [ ] **Step 2: Create domain/booking.py (enums)**

```bash
mkdir -p bootstrap-manager-backend/app/domain
cat > bootstrap-manager-backend/app/domain/booking.py << 'EOF'
from enum import Enum

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
EOF
```

- [ ] **Step 3: Create domain/user.py (enums)**

```bash
cat > bootstrap-manager-backend/app/domain/user.py << 'EOF'
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"
EOF
```

- [ ] **Step 4: Create domain/__init__.py**

```bash
cat > bootstrap-manager-backend/app/domain/__init__.py << 'EOF'
from .booking import BookingStatus
from .user import UserRole

__all__ = ["BookingStatus", "UserRole"]
EOF
```

- [ ] **Step 5: Create models/db.py (SQLAlchemy ORM)**

```bash
mkdir -p bootstrap-manager-backend/app/models
cat > bootstrap-manager-backend/app/models/db.py << 'EOF'
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Table, Enum as SQLEnum, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
from app.domain.user import UserRole
from app.domain.booking import BookingStatus

# Association table for Captain-Boat many-to-many relationship
captain_boats = Table(
    'captain_boats',
    Base.metadata,
    Column('captain_id', Integer, ForeignKey('captains.id', ondelete='CASCADE')),
    Column('boat_id', Integer, ForeignKey('boats.id', ondelete='CASCADE')),
    UniqueConstraint('captain_id', 'boat_id')
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.STAFF)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    bookings = relationship("Booking", back_populates="created_by_user")

class Boat(Base):
    __tablename__ = "boats"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    type = Column(String(100), nullable=False)
    description = Column(Text)
    available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    bookings = relationship("Booking", back_populates="boat")
    captains = relationship("Captain", secondary=captain_boats, back_populates="boats")
    
    __table_args__ = (
        CheckConstraint('capacity > 0'),
    )

class Captain(Base):
    __tablename__ = "captains"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20))
    certifications = Column(Text)  # JSON-encoded list or comma-separated
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    boats = relationship("Boat", secondary=captain_boats, back_populates="captains")
    bookings = relationship("Booking", back_populates="captain")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(20))
    customer_company = Column(String(255))
    participants = Column(Integer, nullable=False)
    boat_id = Column(Integer, ForeignKey('boats.id'), nullable=False)
    captain_id = Column(Integer, ForeignKey('captains.id'), nullable=False)
    catering = Column(Boolean, default=False)
    notes = Column(Text)
    status = Column(SQLEnum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    boat = relationship("Boat", back_populates="bookings")
    captain = relationship("Captain", back_populates="bookings")
    created_by_user = relationship("User", back_populates="bookings")
    
    __table_args__ = (
        CheckConstraint('participants > 0'),
        CheckConstraint('end_date > start_date'),
        UniqueConstraint('boat_id', 'start_date', 'end_date', name='unique_boat_confirmed_time',
                        sqlite_where="status = 'confirmed'"),
    )
EOF
```

- [ ] **Step 6: Create models/__init__.py**

```bash
cat > bootstrap-manager-backend/app/models/__init__.py << 'EOF'
from .db import User, Boat, Captain, Booking, captain_boats

__all__ = ["User", "Boat", "Captain", "Booking", "captain_boats"]
EOF
```

- [ ] **Step 7: Create database tables**

```bash
cd bootstrap-manager-backend
python << 'PYEOF'
from app.db.database import Base, engine
from app.models.db import User, Boat, Captain, Booking

Base.metadata.create_all(bind=engine)
print("✓ Database tables created successfully")
PYEOF
```

- [ ] **Step 8: Verify tables exist**

```bash
cd bootstrap-manager-backend
psql postgresql://boat_user:boat_password@localhost:5432/boat_tour -c "\dt"
```

Expected: List showing users, boats, captains, bookings, captain_boats tables

- [ ] **Step 9: Commit**

```bash
git add bootstrap-manager-backend/app/db/ \
        bootstrap-manager-backend/app/domain/ \
        bootstrap-manager-backend/app/models/
git commit -m "feat: create SQLAlchemy ORM models and database schema"
```

---

### Task 3: Pydantic Schemas (Request/Response Models)

**Files:**
- Create: `bootstrap-manager-backend/app/models/schemas.py`

- [ ] **Step 1: Create schemas.py**

```bash
cat > bootstrap-manager-backend/app/models/schemas.py << 'EOF'
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from app.domain.user import UserRole
from app.domain.booking import BookingStatus

# ============ User Schemas ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserRoleUpdate(BaseModel):
    role: UserRole

# ============ Auth Schemas ============

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    refresh_token: str

# ============ Boat Schemas ============

class BoatCreate(BaseModel):
    name: str = Field(..., min_length=1)
    capacity: int = Field(..., gt=0)
    type: str = Field(..., min_length=1)
    description: Optional[str] = None
    available: bool = True

class BoatUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)
    type: Optional[str] = None
    description: Optional[str] = None
    available: Optional[bool] = None

class BoatResponse(BaseModel):
    id: int
    name: str
    capacity: int
    type: str
    description: Optional[str]
    available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class BoatAvailability(BaseModel):
    available: bool
    reason: Optional[str] = None
    bookings: List[dict] = []

# ============ Captain Schemas ============

class CaptainCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    phone: Optional[str] = None
    certifications: List[str] = []

class CaptainUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    certifications: Optional[List[str]] = None

class CaptainBoatsUpdate(BaseModel):
    boat_ids: List[int]

class CaptainResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    certifications: List[str]
    available_boats: List[BoatResponse]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============ Customer Schemas ============

class CustomerInfo(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None

# ============ Booking Schemas ============

class BookingCreate(BaseModel):
    start_date: datetime
    end_date: datetime
    customer: CustomerInfo
    participants: int = Field(..., gt=0)
    boat_id: int
    captain_id: int
    catering: bool = False
    notes: Optional[str] = None

class BookingUpdate(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    customer: Optional[CustomerInfo] = None
    participants: Optional[int] = Field(None, gt=0)
    boat_id: Optional[int] = None
    captain_id: Optional[int] = None
    catering: Optional[bool] = None
    notes: Optional[str] = None
    status: Optional[BookingStatus] = None

class BookingResponse(BaseModel):
    id: int
    start_date: datetime
    end_date: datetime
    customer_name: str
    customer_email: str
    customer_phone: Optional[str]
    customer_company: Optional[str]
    participants: int
    boat: BoatResponse
    captain: CaptainResponse
    catering: bool
    notes: Optional[str]
    status: BookingStatus
    created_at: datetime
    created_by: int
    
    class Config:
        from_attributes = True

class BookingAvailabilityCheck(BaseModel):
    boat_id: int
    captain_id: int
    start_date: datetime
    end_date: datetime

class AvailabilityResponse(BaseModel):
    boat_available: bool
    captain_available: bool
    boat_reason: Optional[str] = None
    captain_reason: Optional[str] = None
EOF
```

- [ ] **Step 2: Commit**

```bash
git add bootstrap-manager-backend/app/models/schemas.py
git commit -m "feat: add Pydantic schemas for API request/response"
```

---

### Task 4: Authentication Service (JWT + Password Hashing)

**Files:**
- Create: `bootstrap-manager-backend/app/services/__init__.py`
- Create: `bootstrap-manager-backend/app/services/auth_service.py`
- Create: `bootstrap-manager-backend/tests/conftest.py`
- Create: `bootstrap-manager-backend/tests/test_auth.py`

- [ ] **Step 1: Create services/__init__.py**

```bash
mkdir -p bootstrap-manager-backend/app/services
cat > bootstrap-manager-backend/app/services/__init__.py << 'EOF'
"""Services for business logic"""
EOF
```

- [ ] **Step 2: Create auth_service.py**

```bash
cat > bootstrap-manager-backend/app/services/auth_service.py << 'EOF'
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import get_settings
from app.models.schemas import UserCreate, TokenResponse
from sqlalchemy.orm import Session
from app.models.db import User

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_tokens(user_id: int, email: str, role: str) -> TokenResponse:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        access_token_data = {
            "sub": str(user_id),
            "email": email,
            "role": role,
            "type": "access"
        }
        access_token = AuthService._create_token(access_token_data, access_token_expires)
        
        refresh_token_data = {
            "sub": str(user_id),
            "email": email,
            "role": role,
            "type": "refresh"
        }
        refresh_token = AuthService._create_token(refresh_token_data, refresh_token_expires)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
    
    @staticmethod
    def _create_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=1)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            return None
EOF
```

- [ ] **Step 3: Create tests/conftest.py (pytest fixtures)**

```bash
mkdir -p bootstrap-manager-backend/tests
cat > bootstrap-manager-backend/tests/conftest.py << 'EOF'
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.models.db import User, Boat, Captain
from app.domain.user import UserRole
from app.services.auth_service import AuthService

# Use SQLite for testing
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="function")
def test_db():
    engine = create_engine(
        TEST_SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    yield db
    db.close()
    
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user(test_db):
    user = User(
        email="test@example.com",
        password_hash=AuthService.hash_password("password123"),
        name="Test User",
        role=UserRole.STAFF
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_admin(test_db):
    admin = User(
        email="admin@example.com",
        password_hash=AuthService.hash_password("password123"),
        name="Admin User",
        role=UserRole.ADMIN
    )
    test_db.add(admin)
    test_db.commit()
    test_db.refresh(admin)
    return admin

@pytest.fixture
def test_boat(test_db):
    boat = Boat(
        name="Test Boat",
        capacity=50,
        type="Excursion",
        description="Test boat for unit tests",
        available=True
    )
    test_db.add(boat)
    test_db.commit()
    test_db.refresh(boat)
    return boat

@pytest.fixture
def test_captain(test_db, test_boat):
    captain = Captain(
        name="Test Captain",
        email="captain@example.com",
        phone="+49123456789",
        certifications="Sportbootführerschein Binnen"
    )
    test_db.add(captain)
    test_db.commit()
    test_db.refresh(captain)
    captain.boats.append(test_boat)
    test_db.commit()
    return captain
EOF
```

- [ ] **Step 4: Create tests/test_auth.py**

```bash
cat > bootstrap-manager-backend/tests/test_auth.py << 'EOF'
from app.services.auth_service import AuthService

def test_hash_password():
    password = "mypassword123"
    hashed = AuthService.hash_password(password)
    assert hashed != password
    assert AuthService.verify_password(password, hashed)

def test_hash_password_different_hashes():
    password = "mypassword123"
    hash1 = AuthService.hash_password(password)
    hash2 = AuthService.hash_password(password)
    assert hash1 != hash2

def test_verify_password_wrong():
    password = "mypassword123"
    wrong_password = "wrongpassword"
    hashed = AuthService.hash_password(password)
    assert not AuthService.verify_password(wrong_password, hashed)

def test_create_tokens():
    tokens = AuthService.create_tokens(user_id=1, email="test@example.com", role="staff")
    assert tokens.access_token
    assert tokens.refresh_token
    assert tokens.token_type == "bearer"

def test_verify_token():
    tokens = AuthService.create_tokens(user_id=1, email="test@example.com", role="staff")
    payload = AuthService.verify_token(tokens.access_token)
    assert payload is not None
    assert payload["sub"] == "1"
    assert payload["email"] == "test@example.com"
    assert payload["role"] == "staff"

def test_verify_invalid_token():
    invalid_token = "invalid.token.here"
    payload = AuthService.verify_token(invalid_token)
    assert payload is None
EOF
```

- [ ] **Step 5: Run auth tests**

```bash
cd bootstrap-manager-backend
pytest tests/test_auth.py -v
```

Expected: All 5 tests pass

- [ ] **Step 6: Commit**

```bash
git add bootstrap-manager-backend/app/services/ \
        bootstrap-manager-backend/tests/
git commit -m "feat: implement authentication service with JWT and password hashing"
```

---

### Task 5: Repositories (Database Access Layer)

**Files:**
- Create: `bootstrap-manager-backend/app/repositories/__init__.py`
- Create: `bootstrap-manager-backend/app/repositories/base.py`
- Create: `bootstrap-manager-backend/app/repositories/user_repo.py`
- Create: `bootstrap-manager-backend/app/repositories/boat_repo.py`
- Create: `bootstrap-manager-backend/app/repositories/captain_repo.py`
- Create: `bootstrap-manager-backend/app/repositories/booking_repo.py`

- [ ] **Step 1: Create repositories/__init__.py**

```bash
mkdir -p bootstrap-manager-backend/app/repositories
cat > bootstrap-manager-backend/app/repositories/__init__.py << 'EOF'
"""Repository layer for database access"""
EOF
```

- [ ] **Step 2: Create base.py (abstract repository)**

```bash
cat > bootstrap-manager-backend/app/repositories/base.py << 'EOF'
from typing import TypeVar, Generic, Type, List, Optional
from sqlalchemy.orm import Session

T = TypeVar('T')

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db
    
    def create(self, obj_in) -> T:
        db_obj = self.model(**obj_in.dict())
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def get(self, id: int) -> Optional[T]:
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def update(self, id: int, obj_in) -> Optional[T]:
        db_obj = self.get(id)
        if not db_obj:
            return None
        
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: int) -> bool:
        db_obj = self.get(id)
        if not db_obj:
            return False
        
        self.db.delete(db_obj)
        self.db.commit()
        return True
EOF
```

- [ ] **Step 3: Create user_repo.py**

```bash
cat > bootstrap-manager-backend/app/repositories/user_repo.py << 'EOF'
from sqlalchemy.orm import Session
from app.models.db import User
from app.repositories.base import BaseRepository
from typing import Optional

class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)
    
    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.get(user_id)
    
    def email_exists(self, email: str) -> bool:
        return self.db.query(User).filter(User.email == email).first() is not None
EOF
```

- [ ] **Step 4: Create boat_repo.py**

```bash
cat > bootstrap-manager-backend/app/repositories/boat_repo.py << 'EOF'
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.db import Boat
from app.repositories.base import BaseRepository
from typing import Optional, List
from datetime import datetime

class BoatRepository(BaseRepository[Boat]):
    def __init__(self, db: Session):
        super().__init__(Boat, db)
    
    def get_by_name(self, name: str) -> Optional[Boat]:
        return self.db.query(Boat).filter(Boat.name == name).first()
    
    def get_available(self) -> List[Boat]:
        return self.db.query(Boat).filter(Boat.available == True).all()
    
    def get_by_capacity(self, min_capacity: int) -> List[Boat]:
        return self.db.query(Boat).filter(Boat.capacity >= min_capacity).all()
EOF
```

- [ ] **Step 5: Create captain_repo.py**

```bash
cat > bootstrap-manager-backend/app/repositories/captain_repo.py << 'EOF'
from sqlalchemy.orm import Session
from app.models.db import Captain, Boat
from app.repositories.base import BaseRepository
from typing import Optional, List

class CaptainRepository(BaseRepository[Captain]):
    def __init__(self, db: Session):
        super().__init__(Captain, db)
    
    def get_by_email(self, email: str) -> Optional[Captain]:
        return self.db.query(Captain).filter(Captain.email == email).first()
    
    def get_boats(self, captain_id: int) -> List[Boat]:
        captain = self.get(captain_id)
        if not captain:
            return []
        return captain.boats
    
    def assign_boats(self, captain_id: int, boat_ids: List[int]) -> Optional[Captain]:
        captain = self.get(captain_id)
        if not captain:
            return None
        
        captain.boats = self.db.query(Boat).filter(Boat.id.in_(boat_ids)).all()
        self.db.commit()
        self.db.refresh(captain)
        return captain
    
    def can_operate_boat(self, captain_id: int, boat_id: int) -> bool:
        captain = self.get(captain_id)
        if not captain:
            return False
        return any(boat.id == boat_id for boat in captain.boats)
EOF
```

- [ ] **Step 6: Create booking_repo.py**

```bash
cat > bootstrap-manager-backend/app/repositories/booking_repo.py << 'EOF'
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.db import Booking
from app.repositories.base import BaseRepository
from app.domain.booking import BookingStatus
from typing import Optional, List
from datetime import datetime

class BookingRepository(BaseRepository[Booking]):
    def __init__(self, db: Session):
        super().__init__(Booking, db)
    
    def get_by_date_range(self, start: datetime, end: datetime) -> List[Booking]:
        return self.db.query(Booking).filter(
            and_(
                Booking.start_date >= start,
                Booking.end_date <= end
            )
        ).all()
    
    def get_by_boat(self, boat_id: int) -> List[Booking]:
        return self.db.query(Booking).filter(Booking.boat_id == boat_id).all()
    
    def get_by_captain(self, captain_id: int) -> List[Booking]:
        return self.db.query(Booking).filter(Booking.captain_id == captain_id).all()
    
    def get_overlapping(self, boat_id: int, captain_id: int, start: datetime, end: datetime, 
                       exclude_booking_id: Optional[int] = None) -> List[Booking]:
        query = self.db.query(Booking).filter(
            and_(
                or_(
                    Booking.boat_id == boat_id,
                    Booking.captain_id == captain_id
                ),
                Booking.status == BookingStatus.CONFIRMED,
                Booking.start_date < end,
                Booking.end_date > start
            )
        )
        
        if exclude_booking_id:
            query = query.filter(Booking.id != exclude_booking_id)
        
        return query.all()
    
    def get_by_status(self, status: BookingStatus) -> List[Booking]:
        return self.db.query(Booking).filter(Booking.status == status).all()
    
    def get_by_user(self, user_id: int) -> List[Booking]:
        return self.db.query(Booking).filter(Booking.created_by == user_id).all()
EOF
```

- [ ] **Step 7: Commit**

```bash
git add bootstrap-manager-backend/app/repositories/
git commit -m "feat: implement repository layer for database access"
```

---

### Task 6: Business Logic Services

**Files:**
- Create: `bootstrap-manager-backend/app/services/user_service.py`
- Create: `bootstrap-manager-backend/app/services/boat_service.py`
- Create: `bootstrap-manager-backend/app/services/captain_service.py`
- Create: `bootstrap-manager-backend/app/services/booking_service.py`

- [ ] **Step 1: Create user_service.py**

```bash
cat > bootstrap-manager-backend/app/services/user_service.py << 'EOF'
from sqlalchemy.orm import Session
from app.models.db import User
from app.models.schemas import UserCreate, UserUpdate
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService
from typing import Optional
from fastapi import HTTPException

class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)
    
    def register(self, user_create: UserCreate) -> User:
        if self.repo.email_exists(user_create.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        db_user = User(
            email=user_create.email,
            password_hash=AuthService.hash_password(user_create.password),
            name=user_create.name
        )
        self.repo.db.add(db_user)
        self.repo.db.commit()
        self.repo.db.refresh(db_user)
        return db_user
    
    def authenticate(self, email: str, password: str) -> Optional[User]:
        user = self.repo.get_by_email(email)
        if not user or not AuthService.verify_password(password, user.password_hash):
            return None
        return user
    
    def get_user(self, user_id: int) -> Optional[User]:
        return self.repo.get(user_id)
    
    def update_user(self, user_id: int, user_update: UserUpdate) -> Optional[User]:
        user = self.repo.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.repo.db.commit()
        self.repo.db.refresh(user)
        return user
EOF
```

- [ ] **Step 2: Create boat_service.py**

```bash
cat > bootstrap-manager-backend/app/services/boat_service.py << 'EOF'
from sqlalchemy.orm import Session
from app.models.db import Boat
from app.models.schemas import BoatCreate, BoatUpdate
from app.repositories.boat_repo import BoatRepository
from typing import List, Optional
from fastapi import HTTPException

class BoatService:
    def __init__(self, db: Session):
        self.repo = BoatRepository(db)
        self.db = db
    
    def create_boat(self, boat_create: BoatCreate) -> Boat:
        if self.repo.get_by_name(boat_create.name):
            raise HTTPException(status_code=400, detail="Boat name already exists")
        
        db_boat = Boat(**boat_create.dict())
        self.db.add(db_boat)
        self.db.commit()
        self.db.refresh(db_boat)
        return db_boat
    
    def get_boat(self, boat_id: int) -> Optional[Boat]:
        return self.repo.get(boat_id)
    
    def get_all_boats(self) -> List[Boat]:
        return self.repo.get_all()
    
    def update_boat(self, boat_id: int, boat_update: BoatUpdate) -> Optional[Boat]:
        boat = self.repo.get(boat_id)
        if not boat:
            raise HTTPException(status_code=404, detail="Boat not found")
        
        update_data = boat_update.dict(exclude_unset=True)
        
        # Check if name is being changed and if new name exists
        if "name" in update_data and update_data["name"] != boat.name:
            if self.repo.get_by_name(update_data["name"]):
                raise HTTPException(status_code=400, detail="Boat name already exists")
        
        for field, value in update_data.items():
            setattr(boat, field, value)
        
        self.db.commit()
        self.db.refresh(boat)
        return boat
    
    def delete_boat(self, boat_id: int) -> bool:
        return self.repo.delete(boat_id)
EOF
```

- [ ] **Step 3: Create captain_service.py**

```bash
cat > bootstrap-manager-backend/app/services/captain_service.py << 'EOF'
from sqlalchemy.orm import Session
from app.models.db import Captain
from app.models.schemas import CaptainCreate, CaptainUpdate
from app.repositories.captain_repo import CaptainRepository
from typing import List, Optional
from fastapi import HTTPException
import json

class CaptainService:
    def __init__(self, db: Session):
        self.repo = CaptainRepository(db)
        self.db = db
    
    def create_captain(self, captain_create: CaptainCreate) -> Captain:
        db_captain = Captain(
            name=captain_create.name,
            email=captain_create.email,
            phone=captain_create.phone,
            certifications=json.dumps(captain_create.certifications) if captain_create.certifications else None
        )
        self.db.add(db_captain)
        self.db.commit()
        self.db.refresh(db_captain)
        return db_captain
    
    def get_captain(self, captain_id: int) -> Optional[Captain]:
        return self.repo.get(captain_id)
    
    def get_all_captains(self) -> List[Captain]:
        return self.repo.get_all()
    
    def update_captain(self, captain_id: int, captain_update: CaptainUpdate) -> Optional[Captain]:
        captain = self.repo.get(captain_id)
        if not captain:
            raise HTTPException(status_code=404, detail="Captain not found")
        
        update_data = captain_update.dict(exclude_unset=True)
        
        if "certifications" in update_data and update_data["certifications"] is not None:
            update_data["certifications"] = json.dumps(update_data["certifications"])
        
        for field, value in update_data.items():
            setattr(captain, field, value)
        
        self.db.commit()
        self.db.refresh(captain)
        return captain
    
    def delete_captain(self, captain_id: int) -> bool:
        return self.repo.delete(captain_id)
    
    def assign_boats(self, captain_id: int, boat_ids: List[int]) -> Optional[Captain]:
        return self.repo.assign_boats(captain_id, boat_ids)
    
    def can_operate_boat(self, captain_id: int, boat_id: int) -> bool:
        return self.repo.can_operate_boat(captain_id, boat_id)
EOF
```

- [ ] **Step 4: Create booking_service.py (core business logic)**

```bash
cat > bootstrap-manager-backend/app/services/booking_service.py << 'EOF'
from sqlalchemy.orm import Session
from app.models.db import Booking, Boat, Captain
from app.models.schemas import BookingCreate, BookingUpdate
from app.repositories.booking_repo import BookingRepository
from app.repositories.boat_repo import BoatRepository
from app.repositories.captain_repo import CaptainRepository
from app.domain.booking import BookingStatus
from typing import List, Optional
from fastapi import HTTPException
from datetime import datetime

class BookingService:
    def __init__(self, db: Session):
        self.repo = BookingRepository(db)
        self.boat_repo = BoatRepository(db)
        self.captain_repo = CaptainRepository(db)
        self.db = db
    
    def create_booking(self, booking_create: BookingCreate, user_id: int) -> Booking:
        # Validation: Dates
        if booking_create.end_date <= booking_create.start_date:
            raise HTTPException(status_code=400, detail="End date must be after start date")
        
        # Validation: Boat exists and has capacity
        boat = self.boat_repo.get(booking_create.boat_id)
        if not boat:
            raise HTTPException(status_code=400, detail="Boat not found")
        if boat.capacity < booking_create.participants:
            raise HTTPException(status_code=400, detail=f"Boat capacity ({boat.capacity}) less than participants ({booking_create.participants})")
        
        # Validation: Captain exists
        captain = self.captain_repo.get(booking_create.captain_id)
        if not captain:
            raise HTTPException(status_code=400, detail="Captain not found")
        
        # Validation: Captain can operate this boat
        if not self.captain_repo.can_operate_boat(booking_create.captain_id, booking_create.boat_id):
            raise HTTPException(status_code=400, detail="Captain is not qualified for this boat")
        
        # Validation: No double-booking (boat)
        overlapping = self.repo.get_overlapping(
            booking_create.boat_id,
            booking_create.captain_id,
            booking_create.start_date,
            booking_create.end_date
        )
        
        if overlapping:
            boat_overlaps = [b for b in overlapping if b.boat_id == booking_create.boat_id]
            captain_overlaps = [b for b in overlapping if b.captain_id == booking_create.captain_id]
            
            if boat_overlaps:
                raise HTTPException(status_code=409, detail="Boat is already booked for this time")
            if captain_overlaps:
                raise HTTPException(status_code=409, detail="Captain is not available for this time")
        
        # Create booking
        db_booking = Booking(
            start_date=booking_create.start_date,
            end_date=booking_create.end_date,
            customer_name=booking_create.customer.name,
            customer_email=booking_create.customer.email,
            customer_phone=booking_create.customer.phone,
            customer_company=booking_create.customer.company,
            participants=booking_create.participants,
            boat_id=booking_create.boat_id,
            captain_id=booking_create.captain_id,
            catering=booking_create.catering,
            notes=booking_create.notes,
            status=BookingStatus.PENDING,
            created_by=user_id
        )
        
        self.db.add(db_booking)
        self.db.commit()
        self.db.refresh(db_booking)
        return db_booking
    
    def get_booking(self, booking_id: int) -> Optional[Booking]:
        return self.repo.get(booking_id)
    
    def get_all_bookings(self) -> List[Booking]:
        return self.repo.get_all()
    
    def get_user_bookings(self, user_id: int) -> List[Booking]:
        return self.repo.get_by_user(user_id)
    
    def update_booking(self, booking_id: int, booking_update: BookingUpdate, user_id: int) -> Optional[Booking]:
        booking = self.repo.get(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get updated values or fall back to current values
        start_date = booking_update.start_date or booking.start_date
        end_date = booking_update.end_date or booking.end_date
        boat_id = booking_update.boat_id or booking.boat_id
        captain_id = booking_update.captain_id or booking.captain_id
        participants = booking_update.participants or booking.participants
        
        # Re-validate if dates/boat/captain changed
        if (start_date != booking.start_date or end_date != booking.end_date or 
            boat_id != booking.boat_id or captain_id != booking.captain_id):
            
            # Validate boat capacity
            boat = self.boat_repo.get(boat_id)
            if not boat:
                raise HTTPException(status_code=400, detail="Boat not found")
            if boat.capacity < participants:
                raise HTTPException(status_code=400, detail="Boat capacity insufficient")
            
            # Validate captain qualifications
            if not self.captain_repo.can_operate_boat(captain_id, boat_id):
                raise HTTPException(status_code=400, detail="Captain not qualified for this boat")
            
            # Check for overlaps (excluding current booking)
            overlapping = self.repo.get_overlapping(boat_id, captain_id, start_date, end_date, booking_id)
            if overlapping:
                raise HTTPException(status_code=409, detail="Time slot conflict")
        
        # Update fields
        update_data = booking_update.dict(exclude_unset=True)
        if "customer" in update_data:
            customer = update_data["customer"]
            booking.customer_name = customer.name
            booking.customer_email = customer.email
            booking.customer_phone = customer.phone
            booking.customer_company = customer.company
            del update_data["customer"]
        
        for field, value in update_data.items():
            setattr(booking, field, value)
        
        self.db.commit()
        self.db.refresh(booking)
        return booking
    
    def delete_booking(self, booking_id: int) -> bool:
        booking = self.repo.get(booking_id)
        if not booking:
            return False
        booking.status = BookingStatus.CANCELLED
        self.db.commit()
        return True
EOF
```

- [ ] **Step 5: Commit**

```bash
git add bootstrap-manager-backend/app/services/
git commit -m "feat: implement business logic services for users, boats, captains, bookings"
```

---

### Task 7: API Routes - Authentication

**Files:**
- Create: `bootstrap-manager-backend/app/api/__init__.py`
- Create: `bootstrap-manager-backend/app/api/routes/__init__.py`
- Create: `bootstrap-manager-backend/app/api/routes/auth.py`
- Create: `bootstrap-manager-backend/app/middleware/__init__.py`
- Create: `bootstrap-manager-backend/app/middleware/auth.py`

- [ ] **Step 1: Create api/__init__.py**

```bash
mkdir -p bootstrap-manager-backend/app/api/routes
cat > bootstrap-manager-backend/app/api/__init__.py << 'EOF'
"""API routes and middleware"""
EOF
```

- [ ] **Step 2: Create api/routes/__init__.py**

```bash
cat > bootstrap-manager-backend/app/api/routes/__init__.py << 'EOF'
"""API route modules"""
EOF
```

- [ ] **Step 3: Create middleware/__init__.py**

```bash
mkdir -p bootstrap-manager-backend/app/middleware
cat > bootstrap-manager-backend/app/middleware/__init__.py << 'EOF'
"""Middleware for FastAPI"""
EOF
```

- [ ] **Step 4: Create middleware/auth.py (JWT verification)**

```bash
cat > bootstrap-manager-backend/app/middleware/auth.py << 'EOF'
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from app.services.auth_service import AuthService
from app.domain.user import UserRole
from typing import Optional

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> dict:
    payload = AuthService.verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return payload

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can perform this action"
        )
    return current_user

async def get_staff_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in [UserRole.ADMIN.value, UserRole.STAFF.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and staff can perform this action"
        )
    return current_user
EOF
```

- [ ] **Step 5: Create api/routes/auth.py**

```bash
cat > bootstrap-manager-backend/app/api/routes/auth.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import UserCreate, UserResponse, TokenResponse, TokenRefresh
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_create: UserCreate, db: Session = Depends(get_db)):
    service = UserService(db)
    user = service.register(user_create)
    return user

@router.post("/login", response_model=TokenResponse)
def login(email: str, password: str, db: Session = Depends(get_db)):
    service = UserService(db)
    user = service.authenticate(email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    tokens = AuthService.create_tokens(user.id, user.email, user.role.value)
    return tokens

@router.post("/refresh", response_model=TokenResponse)
def refresh(token_refresh: TokenRefresh, db: Session = Depends(get_db)):
    payload = AuthService.verify_token(token_refresh.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = int(payload.get("sub"))
    service = UserService(db)
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    tokens = AuthService.create_tokens(user.id, user.email, user.role.value)
    return tokens

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    # In a real app, you'd invalidate the refresh token here
    # For now, just return success (client removes tokens)
    return {"message": "Logged out successfully"}
EOF
```

- [ ] **Step 6: Commit**

```bash
git add bootstrap-manager-backend/app/api/ \
        bootstrap-manager-backend/app/middleware/
git commit -m "feat: implement authentication API routes and JWT middleware"
```

---

### Task 8: API Routes - Boats, Captains, Bookings, Users

**Files:**
- Create: `bootstrap-manager-backend/app/api/routes/boats.py`
- Create: `bootstrap-manager-backend/app/api/routes/captains.py`
- Create: `bootstrap-manager-backend/app/api/routes/bookings.py`
- Create: `bootstrap-manager-backend/app/api/routes/users.py`

- [ ] **Step 1: Create api/routes/boats.py**

```bash
cat > bootstrap-manager-backend/app/api/routes/boats.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import BoatCreate, BoatUpdate, BoatResponse
from app.services.boat_service import BoatService
from app.middleware.auth import get_admin_user
from typing import List

router = APIRouter(prefix="/api/boats", tags=["boats"])

@router.get("", response_model=List[BoatResponse])
def list_boats(db: Session = Depends(get_db)):
    service = BoatService(db)
    return service.get_all_boats()

@router.post("", response_model=BoatResponse, status_code=status.HTTP_201_CREATED)
def create_boat(boat: BoatCreate, admin: dict = Depends(get_admin_user), db: Session = Depends(get_db)):
    service = BoatService(db)
    return service.create_boat(boat)

@router.get("/{boat_id}", response_model=BoatResponse)
def get_boat(boat_id: int, db: Session = Depends(get_db)):
    service = BoatService(db)
    boat = service.get_boat(boat_id)
    if not boat:
        raise HTTPException(status_code=404, detail="Boat not found")
    return boat

@router.put("/{boat_id}", response_model=BoatResponse)
def update_boat(boat_id: int, boat_update: BoatUpdate, admin: dict = Depends(get_admin_user), db: Session = Depends(get_db)):
    service = BoatService(db)
    boat = service.update_boat(boat_id, boat_update)
    if not boat:
        raise HTTPException(status_code=404, detail="Boat not found")
    return boat

@router.delete("/{boat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_boat(boat_id: int, admin: dict = Depends(get_admin_user), db: Session = Depends(get_db)):
    service = BoatService(db)
    if not service.delete_boat(boat_id):
        raise HTTPException(status_code=404, detail="Boat not found")
EOF
```

- [ ] **Step 2: Create api/routes/captains.py**

```bash
cat > bootstrap-manager-backend/app/api/routes/captains.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import CaptainCreate, CaptainUpdate, CaptainResponse, CaptainBoatsUpdate
from app.services.captain_service import CaptainService
from app.middleware.auth import get_admin_user
from typing import List
import json

router = APIRouter(prefix="/api/captains", tags=["captains"])

@router.get("", response_model=List[CaptainResponse])
def list_captains(db: Session = Depends(get_db)):
    service = CaptainService(db)
    captains = service.get_all_captains()
    # Convert certifications from JSON string to list
    for captain in captains:
        if captain.certifications:
            captain.certifications = json.loads(captain.certifications)
    return captains

@router.post("", response_model=CaptainResponse, status_code=status.HTTP_201_CREATED)
def create_captain(captain: CaptainCreate, admin: dict = Depends(get_admin_user), db: Session = Depends(get_db)):
    service = CaptainService(db)
    new_captain = service.create_captain(captain)
    if new_captain.certifications:
        new_captain.certifications = json.loads(new_captain.certifications)
    return new_captain

@router.get("/{captain_id}", response_model=CaptainResponse)
def get_captain(captain_id: int, db: Session = Depends(get_db)):
    service = CaptainService(db)
    captain = service.get_captain(captain_id)
    if not captain:
        raise HTTPException(status_code=404, detail="Captain not found")
    if captain.certifications:
        captain.certifications = json.loads(captain.certifications)
    return captain

@router.put("/{captain_id}", response_model=CaptainResponse)
def update_captain(captain_id: int, captain_update: CaptainUpdate, admin: dict = Depends(get_admin_user), db: Session = Depends(get_db)):
    service = CaptainService(db)
    captain = service.update_captain(captain_id, captain_update)
    if not captain:
        raise HTTPException(status_code=404, detail="Captain not found")
    if captain.certifications:
        captain.certifications = json.loads(captain.certifications)
    return captain

@router.delete("/{captain_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_captain(captain_id: int, admin: dict = Depends(get_admin_user), db: Session = Depends(get_db)):
    service = CaptainService(db)
    if not service.delete_captain(captain_id):
        raise HTTPException(status_code=404, detail="Captain not found")

@router.put("/{captain_id}/boats", response_model=CaptainResponse)
def assign_boats(captain_id: int, boats_update: CaptainBoatsUpdate, admin: dict = Depends(get_admin_user), db: Session = Depends(get_db)):
    service = CaptainService(db)
    captain = service.assign_boats(captain_id, boats_update.boat_ids)
    if not captain:
        raise HTTPException(status_code=404, detail="Captain not found")
    if captain.certifications:
        captain.certifications = json.loads(captain.certifications)
    return captain
EOF
```

- [ ] **Step 3: Create api/routes/bookings.py**

```bash
cat > bootstrap-manager-backend/app/api/routes/bookings.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import BookingCreate, BookingUpdate, BookingResponse, BookingAvailabilityCheck, AvailabilityResponse
from app.services.booking_service import BookingService
from app.domain.booking import BookingStatus
from app.middleware.auth import get_current_user, get_staff_user, get_admin_user
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

@router.get("", response_model=List[BookingResponse])
def list_bookings(
    status_filter: Optional[str] = Query(None),
    boat_id: Optional[int] = Query(None),
    captain_id: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BookingService(db)
    bookings = service.get_all_bookings()
    
    # Filter by status if provided
    if status_filter:
        bookings = [b for b in bookings if b.status.value == status_filter]
    
    # Filter by boat if provided
    if boat_id:
        bookings = [b for b in bookings if b.boat_id == boat_id]
    
    # Filter by captain if provided
    if captain_id:
        bookings = [b for b in bookings if b.captain_id == captain_id]
    
    # If not admin, only show own bookings
    if current_user.get("role") != "admin":
        user_id = int(current_user.get("sub"))
        bookings = [b for b in bookings if b.created_by == user_id]
    
    return bookings

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(booking: BookingCreate, staff: dict = Depends(get_staff_user), db: Session = Depends(get_db)):
    user_id = int(staff.get("sub"))
    service = BookingService(db)
    return service.create_booking(booking, user_id)

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    service = BookingService(db)
    booking = service.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check access: own booking or admin
    if current_user.get("role") != "admin" and booking.created_by != int(current_user.get("sub")):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return booking

@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(booking_id: int, booking_update: BookingUpdate, staff: dict = Depends(get_staff_user), db: Session = Depends(get_db)):
    user_id = int(staff.get("sub"))
    service = BookingService(db)
    
    # Check access
    booking = service.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if staff.get("role") != "admin" and booking.created_by != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return service.update_booking(booking_id, booking_update, user_id)

@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(booking_id: int, staff: dict = Depends(get_staff_user), db: Session = Depends(get_db)):
    user_id = int(staff.get("sub"))
    service = BookingService(db)
    
    # Check access
    booking = service.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if staff.get("role") != "admin" and booking.created_by != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not service.delete_booking(booking_id):
        raise HTTPException(status_code=404, detail="Booking not found")

@router.post("/check-availability", response_model=AvailabilityResponse)
def check_availability(check: BookingAvailabilityCheck, db: Session = Depends(get_db)):
    service = BookingService(db)
    from app.repositories.booking_repo import BookingRepository
    repo = BookingRepository(db)
    
    overlapping = repo.get_overlapping(
        check.boat_id,
        check.captain_id,
        check.start_date,
        check.end_date
    )
    
    boat_available = not any(b.boat_id == check.boat_id for b in overlapping)
    captain_available = not any(b.captain_id == check.captain_id for b in overlapping)
    
    return AvailabilityResponse(
        boat_available=boat_available,
        captain_available=captain_available,
        boat_reason="Boat already booked" if not boat_available else None,
        captain_reason="Captain not available" if not captain_available else None
    )
EOF
```

- [ ] **Step 4: Create api/routes/users.py**

```bash
cat > bootstrap-manager-backend/app/api/routes/users.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schemas import UserResponse, UserUpdate, UserRoleUpdate
from app.services.user_service import UserService
from app.middleware.auth import get_current_user, get_admin_user
from typing import List

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = int(current_user.get("sub"))
    service = UserService(db)
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/me", response_model=UserResponse)
def update_current_user(user_update: UserUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = int(current_user.get("sub"))
    service = UserService(db)
    user = service.update_user(user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("", response_model=List[UserResponse])
def list_users(admin: dict = Depends(get_admin_user), db: Session = Depends(get_db)):
    from app.repositories.user_repo import UserRepository
    repo = UserRepository(db)
    return repo.get_all()

@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: int, role_update: UserRoleUpdate, admin: dict = Depends(get_admin_user), db: Session = Depends(get_db)):
    service = UserService(db)
    from app.models.db import User
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user
EOF
```

- [ ] **Step 5: Commit**

```bash
git add bootstrap-manager-backend/app/api/routes/
git commit -m "feat: implement all API routes for boats, captains, bookings, users"
```

---

### Task 9: Main FastAPI Application Setup

**Files:**
- Create: `bootstrap-manager-backend/app/main.py`

- [ ] **Step 1: Create main.py**

```bash
cat > bootstrap-manager-backend/app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.routes import auth, boats, captains, bookings, users

settings = get_settings()

app = FastAPI(
    title="Boat Tour Management API",
    description="API for managing boat tours, boats, captains, and bookings",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "http://localhost:3000",  # Alternative
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["content-type"]
)

# Include routers
app.include_router(auth.router)
app.include_router(boats.router)
app.include_router(captains.router)
app.include_router(bookings.router)
app.include_router(users.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
EOF
```

- [ ] **Step 2: Test the server starts**

```bash
cd bootstrap-manager-backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
sleep 3
curl http://localhost:8000/health
kill %1
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Commit**

```bash
git add bootstrap-manager-backend/app/main.py
git commit -m "feat: create main FastAPI application with CORS and route integration"
```

---

## Phase 2: Frontend Integration

### Task 10: API Client Setup (axios + interceptors)

**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/endpoints.ts`

- [ ] **Step 1: Create src/api/client.ts**

```bash
mkdir -p /Users/tobiho/Documents/git/bootstraum-manager/src/api
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/api/client.ts << 'EOF'
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add JWT token
apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
EOF
```

- [ ] **Step 2: Create src/api/endpoints.ts**

```bash
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/api/endpoints.ts << 'EOF'
import apiClient from './client';
import { 
  UserCreate, 
  TokenResponse, 
  BoatCreate, 
  BoatUpdate,
  BoatResponse,
  CaptainCreate,
  CaptainUpdate,
  CaptainResponse,
  BookingCreate,
  BookingUpdate,
  BookingResponse,
  BookingAvailabilityCheck,
  AvailabilityResponse
} from '../types/api';

// Auth
export const authAPI = {
  register: (data: UserCreate) => apiClient.post<UserCreate>('/auth/register', data),
  login: (email: string, password: string) => 
    apiClient.post<TokenResponse>('/auth/login', { email, password }),
  refresh: (refreshToken: string) =>
    apiClient.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => apiClient.post('/auth/logout'),
};

// Users
export const userAPI = {
  getProfile: () => apiClient.get('/users/me'),
  updateProfile: (data) => apiClient.put('/users/me', data),
  listUsers: () => apiClient.get<any[]>('/users'),
  updateRole: (userId: number, role: string) =>
    apiClient.put(`/users/${userId}/role`, { role }),
};

// Boats
export const boatAPI = {
  list: () => apiClient.get<BoatResponse[]>('/boats'),
  get: (boatId: number) => apiClient.get<BoatResponse>(`/boats/${boatId}`),
  create: (data: BoatCreate) => apiClient.post<BoatResponse>('/boats', data),
  update: (boatId: number, data: BoatUpdate) =>
    apiClient.put<BoatResponse>(`/boats/${boatId}`, data),
  delete: (boatId: number) => apiClient.delete(`/boats/${boatId}`),
};

// Captains
export const captainAPI = {
  list: () => apiClient.get<CaptainResponse[]>('/captains'),
  get: (captainId: number) => apiClient.get<CaptainResponse>(`/captains/${captainId}`),
  create: (data: CaptainCreate) => apiClient.post<CaptainResponse>('/captains', data),
  update: (captainId: number, data: CaptainUpdate) =>
    apiClient.put<CaptainResponse>(`/captains/${captainId}`, data),
  delete: (captainId: number) => apiClient.delete(`/captains/${captainId}`),
  assignBoats: (captainId: number, boatIds: number[]) =>
    apiClient.put<CaptainResponse>(`/captains/${captainId}/boats`, { boat_ids: boatIds }),
};

// Bookings
export const bookingAPI = {
  list: (params?: any) => apiClient.get<BookingResponse[]>('/bookings', { params }),
  get: (bookingId: number) => apiClient.get<BookingResponse>(`/bookings/${bookingId}`),
  create: (data: BookingCreate) => apiClient.post<BookingResponse>('/bookings', data),
  update: (bookingId: number, data: BookingUpdate) =>
    apiClient.put<BookingResponse>(`/bookings/${bookingId}`, data),
  delete: (bookingId: number) => apiClient.delete(`/bookings/${bookingId}`),
  checkAvailability: (data: BookingAvailabilityCheck) =>
    apiClient.post<AvailabilityResponse>('/bookings/check-availability', data),
};
EOF
```

- [ ] **Step 3: Create src/types/api.ts (TypeScript interfaces)**

```bash
mkdir -p /Users/tobiho/Documents/git/bootstraum-manager/src/types
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/types/api.ts << 'EOF'
export interface UserCreate {
  email: string;
  password: string;
  name: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface BoatCreate {
  name: string;
  capacity: number;
  type: string;
  description?: string;
  available?: boolean;
}

export interface BoatUpdate extends Partial<BoatCreate> {}

export interface BoatResponse extends BoatCreate {
  id: number;
  created_at: string;
}

export interface CaptainCreate {
  name: string;
  email: string;
  phone?: string;
  certifications: string[];
}

export interface CaptainUpdate extends Partial<CaptainCreate> {}

export interface CaptainResponse extends CaptainCreate {
  id: number;
  available_boats: BoatResponse[];
  created_at: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface BookingCreate {
  start_date: string; // ISO datetime
  end_date: string;
  customer: CustomerInfo;
  participants: number;
  boat_id: number;
  captain_id: number;
  catering?: boolean;
  notes?: string;
}

export interface BookingUpdate extends Partial<BookingCreate> {
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface BookingResponse {
  id: number;
  start_date: string;
  end_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company?: string;
  participants: number;
  boat: BoatResponse;
  captain: CaptainResponse;
  catering: boolean;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  created_by: number;
}

export interface BookingAvailabilityCheck {
  boat_id: number;
  captain_id: number;
  start_date: string;
  end_date: string;
}

export interface AvailabilityResponse {
  boat_available: boolean;
  captain_available: boolean;
  boat_reason?: string;
  captain_reason?: string;
}
EOF
```

- [ ] **Step 4: Commit**

```bash
git add src/api/ src/types/api.ts
git commit -m "feat: add API client with axios interceptors and TypeScript endpoints"
```

---

### Task 11: Authentication Context & Hooks

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/hooks/useAuth.ts`
- Create: `src/hooks/useBookings.ts`
- Create: `src/hooks/useBoats.ts`
- Create: `src/hooks/useCaptains.ts`

- [ ] **Step 1: Create AuthContext.tsx**

```bash
mkdir -p /Users/tobiho/Documents/git/bootstraum-manager/src/contexts
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/contexts/AuthContext.tsx << 'EOF'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserResponse } from '../types/api';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  setUser: (user: UserResponse | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    // Try to restore user session from localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      // Verify token is still valid by fetching user profile
      // This will be done in useAuth hook
    }
  }, []);

  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const getAccessToken = () => localStorage.getItem('access_token');

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    setUser,
    setTokens,
    logout,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
EOF
```

- [ ] **Step 2: Create useAuth.ts hook**

```bash
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/hooks/useAuth.ts << 'EOF'
import { useMutation, useQuery } from '@tanstack/react-query';
import { authAPI } from '../api/endpoints';
import { useAuthContext } from '../contexts/AuthContext';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';
import { UserCreate, TokenResponse } from '../types/api';

export function useAuth() {
  const { setUser, setTokens, logout, getAccessToken, user } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const registerMutation = useMutation(
    (data: UserCreate) => authAPI.register(data).then(r => r.data),
    {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Registration successful. Please log in.' });
        navigate('/login');
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Registration failed',
          variant: 'destructive',
        });
      },
    }
  );

  const loginMutation = useMutation(
    (data: { email: string; password: string }) =>
      authAPI.login(data.email, data.password).then(r => r.data),
    {
      onSuccess: (data: TokenResponse) => {
        setTokens(data.access_token, data.refresh_token);
        // Fetch user profile
        userQuery.refetch();
        navigate('/');
        toast({ title: 'Success', description: 'Logged in successfully' });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Login failed',
          variant: 'destructive',
        });
      },
    }
  );

  const userQuery = useQuery(
    ['user', 'profile'],
    () => {
      const token = getAccessToken();
      if (!token) return null;
      return import('../api/endpoints').then(m => m.userAPI.getProfile().then(r => r.data));
    },
    {
      enabled: !!getAccessToken(),
      onSuccess: (data) => {
        if (data) setUser(data);
      },
    }
  );

  const logoutMutation = useMutation(() => authAPI.logout(), {
    onSuccess: () => {
      logout();
      navigate('/login');
      toast({ title: 'Success', description: 'Logged out successfully' });
    },
  });

  return {
    register: registerMutation.mutate,
    registerLoading: registerMutation.isLoading,
    login: loginMutation.mutate,
    loginLoading: loginMutation.isLoading,
    logout: logoutMutation.mutate,
    logoutLoading: logoutMutation.isLoading,
    user: userQuery.data,
    userLoading: userQuery.isLoading,
  };
}
EOF
```

- [ ] **Step 3: Create useBookings.ts hook**

```bash
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/hooks/useBookings.ts << 'EOF'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingAPI } from '../api/endpoints';
import { useToast } from './use-toast';
import { BookingCreate, BookingUpdate } from '../types/api';

export function useBookings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bookingsQuery = useQuery(
    ['bookings'],
    () => bookingAPI.list().then(r => r.data),
    { staleTime: 5 * 60 * 1000 }
  );

  const createMutation = useMutation(
    (data: BookingCreate) => bookingAPI.create(data).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bookings']);
        toast({ title: 'Success', description: 'Booking created' });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Failed to create booking',
          variant: 'destructive',
        });
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: BookingUpdate }) =>
      bookingAPI.update(id, data).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bookings']);
        toast({ title: 'Success', description: 'Booking updated' });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Failed to update booking',
          variant: 'destructive',
        });
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => bookingAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bookings']);
        toast({ title: 'Success', description: 'Booking deleted' });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Failed to delete booking',
          variant: 'destructive',
        });
      },
    }
  );

  return {
    bookings: bookingsQuery.data || [],
    bookingsLoading: bookingsQuery.isLoading,
    createBooking: createMutation.mutate,
    createLoading: createMutation.isLoading,
    updateBooking: updateMutation.mutate,
    updateLoading: updateMutation.isLoading,
    deleteBooking: deleteMutation.mutate,
    deleteLoading: deleteMutation.isLoading,
  };
}
EOF
```

- [ ] **Step 4: Create useBoats.ts hook**

```bash
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/hooks/useBoats.ts << 'EOF'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boatAPI } from '../api/endpoints';
import { useToast } from './use-toast';
import { BoatCreate, BoatUpdate } from '../types/api';

export function useBoats() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const boatsQuery = useQuery(
    ['boats'],
    () => boatAPI.list().then(r => r.data),
    { staleTime: 5 * 60 * 1000 }
  );

  const createMutation = useMutation(
    (data: BoatCreate) => boatAPI.create(data).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['boats']);
        toast({ title: 'Success', description: 'Boat created' });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Failed to create boat',
          variant: 'destructive',
        });
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: BoatUpdate }) =>
      boatAPI.update(id, data).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['boats']);
        toast({ title: 'Success', description: 'Boat updated' });
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => boatAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['boats']);
        toast({ title: 'Success', description: 'Boat deleted' });
      },
    }
  );

  return {
    boats: boatsQuery.data || [],
    boatsLoading: boatsQuery.isLoading,
    createBoat: createMutation.mutate,
    createLoading: createMutation.isLoading,
    updateBoat: updateMutation.mutate,
    updateLoading: updateMutation.isLoading,
    deleteBoat: deleteMutation.mutate,
    deleteLoading: deleteMutation.isLoading,
  };
}
EOF
```

- [ ] **Step 5: Create useCaptains.ts hook**

```bash
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/hooks/useCaptains.ts << 'EOF'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { captainAPI } from '../api/endpoints';
import { useToast } from './use-toast';
import { CaptainCreate, CaptainUpdate } from '../types/api';

export function useCaptains() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const captainsQuery = useQuery(
    ['captains'],
    () => captainAPI.list().then(r => r.data),
    { staleTime: 5 * 60 * 1000 }
  );

  const createMutation = useMutation(
    (data: CaptainCreate) => captainAPI.create(data).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['captains']);
        toast({ title: 'Success', description: 'Captain created' });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Failed to create captain',
          variant: 'destructive',
        });
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: CaptainUpdate }) =>
      captainAPI.update(id, data).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['captains']);
        toast({ title: 'Success', description: 'Captain updated' });
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => captainAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['captains']);
        toast({ title: 'Success', description: 'Captain deleted' });
      },
    }
  );

  const assignBoatsMutation = useMutation(
    ({ id, boatIds }: { id: number; boatIds: number[] }) =>
      captainAPI.assignBoats(id, boatIds).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['captains']);
        toast({ title: 'Success', description: 'Boats assigned' });
      },
    }
  );

  return {
    captains: captainsQuery.data || [],
    captainsLoading: captainsQuery.isLoading,
    createCaptain: createMutation.mutate,
    createLoading: createMutation.isLoading,
    updateCaptain: updateMutation.mutate,
    updateLoading: updateMutation.isLoading,
    deleteCaptain: deleteMutation.mutate,
    deleteLoading: deleteMutation.isLoading,
    assignBoats: assignBoatsMutation.mutate,
    assignBoatsLoading: assignBoatsMutation.isLoading,
  };
}
EOF
```

- [ ] **Step 6: Commit**

```bash
git add src/contexts/ src/hooks/useAuth.ts src/hooks/useBookings.ts src/hooks/useBoats.ts src/hooks/useCaptains.ts
git commit -m "feat: add authentication context and custom React Query hooks"
```

---

### Task 12: Login & Register Pages

**Files:**
- Create: `src/pages/Login.tsx`
- Create: `src/pages/Register.tsx`
- Create: `src/components/layout/ProtectedRoute.tsx`

- [ ] **Step 1: Create Login.tsx**

```bash
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/pages/Login.tsx << 'EOF'
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-water-light to-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Bootstouren Verwaltung</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loginLoading}>
              {loginLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Noch keinen Account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Hier registrieren
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
EOF
```

- [ ] **Step 2: Create Register.tsx**

```bash
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/pages/Register.tsx << 'EOF'
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { register, registerLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwörter stimmen nicht überein');
      return;
    }
    register({ email, password, name });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-water-light to-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registrieren</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Ihr Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Passwort wiederholen</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={registerLoading}>
              {registerLoading ? 'Wird registriert...' : 'Registrieren'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Bereits ein Account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Hier anmelden
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
EOF
```

- [ ] **Step 3: Create ProtectedRoute.tsx**

```bash
mkdir -p /Users/tobiho/Documents/git/bootstraum-manager/src/components/layout
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/components/layout/ProtectedRoute.tsx << 'EOF'
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
EOF
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.tsx src/pages/Register.tsx src/components/layout/ProtectedRoute.tsx
git commit -m "feat: add login, register, and protected route components"
```

---

### Task 13: Update App.tsx for API Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Update App.tsx**

```bash
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/App.tsx << 'EOF'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Boats from "./pages/Boats";
import Captains from "./pages/Captains";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/boats" element={<ProtectedRoute><Boats /></ProtectedRoute>} />
            <Route path="/captains" element={<ProtectedRoute><Captains /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
EOF
```

- [ ] **Step 2: Update AppLayout.tsx**

Read first to understand structure:

```bash
head -50 /Users/tobiho/Documents/git/bootstraum-manager/src/components/layout/AppLayout.tsx
```

- [ ] **Step 3: Update AppLayout.tsx with logout button**

```bash
cat > /Users/tobiho/Documents/git/bootstraum-manager/src/components/layout/AppLayout.tsx << 'EOF'
import { Navigation } from "./Navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const { logout, logoutLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Navigation />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Willkommen, {user?.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              disabled={logoutLoading}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
EOF
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/layout/AppLayout.tsx
git commit -m "feat: update App.tsx with Auth provider and protected routes"
```

---

## Phase 3: Testing & Deployment

### Task 14: Backend Tests (Unit & Integration)

**Files:**
- Create: `bootstrap-manager-backend/tests/test_boats.py`
- Create: `bootstrap-manager-backend/tests/test_bookings.py`

- [ ] **Step 1: Create test_boats.py**

```bash
cat > bootstrap-manager-backend/tests/test_boats.py << 'EOF'
from app.services.boat_service import BoatService
from app.models.schemas import BoatCreate, BoatUpdate

def test_create_boat(test_db):
    service = BoatService(test_db)
    boat_create = BoatCreate(
        name="Test Boat",
        capacity=50,
        type="Excursion",
        available=True
    )
    boat = service.create_boat(boat_create)
    assert boat.id is not None
    assert boat.name == "Test Boat"
    assert boat.capacity == 50

def test_get_boat(test_db, test_boat):
    service = BoatService(test_db)
    boat = service.get_boat(test_boat.id)
    assert boat is not None
    assert boat.name == "Test Boat"

def test_update_boat(test_db, test_boat):
    service = BoatService(test_db)
    update_data = BoatUpdate(capacity=75)
    boat = service.update_boat(test_boat.id, update_data)
    assert boat.capacity == 75

def test_delete_boat(test_db, test_boat):
    service = BoatService(test_db)
    success = service.delete_boat(test_boat.id)
    assert success
    boat = service.get_boat(test_boat.id)
    assert boat is None
EOF
```

- [ ] **Step 2: Create test_bookings.py**

```bash
cat > bootstrap-manager-backend/tests/test_bookings.py << 'EOF'
from datetime import datetime, timedelta
from app.services.booking_service import BookingService
from app.models.schemas import BookingCreate, CustomerInfo
from app.domain.booking import BookingStatus
import pytest

def test_create_booking(test_db, test_user, test_boat, test_captain):
    service = BookingService(test_db)
    now = datetime.utcnow()
    booking_create = BookingCreate(
        start_date=now + timedelta(days=1),
        end_date=now + timedelta(days=2),
        customer=CustomerInfo(
            name="Test Customer",
            email="customer@test.com",
            phone="+49123456789"
        ),
        participants=10,
        boat_id=test_boat.id,
        captain_id=test_captain.id,
        catering=False
    )
    booking = service.create_booking(booking_create, test_user.id)
    assert booking.id is not None
    assert booking.status == BookingStatus.PENDING

def test_double_booking_prevention(test_db, test_user, test_boat, test_captain):
    service = BookingService(test_db)
    now = datetime.utcnow()
    
    # Create first booking
    booking1_create = BookingCreate(
        start_date=now + timedelta(days=1),
        end_date=now + timedelta(days=2),
        customer=CustomerInfo(
            name="Customer 1",
            email="c1@test.com"
        ),
        participants=10,
        boat_id=test_boat.id,
        captain_id=test_captain.id
    )
    booking1 = service.create_booking(booking1_create, test_user.id)
    booking1.status = BookingStatus.CONFIRMED
    test_db.commit()
    
    # Try to create overlapping booking - should fail
    booking2_create = BookingCreate(
        start_date=now + timedelta(days=1, hours=6),
        end_date=now + timedelta(days=1, hours=12),
        customer=CustomerInfo(
            name="Customer 2",
            email="c2@test.com"
        ),
        participants=5,
        boat_id=test_boat.id,
        captain_id=test_captain.id
    )
    
    with pytest.raises(Exception):  # Should raise HTTPException
        service.create_booking(booking2_create, test_user.id)
EOF
```

- [ ] **Step 3: Run all tests**

```bash
cd bootstrap-manager-backend
pytest tests/ -v
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add bootstrap-manager-backend/tests/test_boats.py \
        bootstrap-manager-backend/tests/test_bookings.py
git commit -m "feat: add unit tests for boats and bookings services"
```

---

### Task 15: Docker Setup & Final Integration Test

**Files:**
- Modify: `bootstrap-manager-backend/docker-compose.yml`
- Create: `bootstrap-manager-backend/Dockerfile`

- [ ] **Step 1: Create Dockerfile**

```bash
cat > bootstrap-manager-backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
```

- [ ] **Step 2: Update docker-compose.yml**

```bash
cat > bootstrap-manager-backend/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-boat_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-boat_password}
      POSTGRES_DB: ${POSTGRES_DB:-boat_tour}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-boat_user}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-boat_user}:${POSTGRES_PASSWORD:-boat_password}@postgres:5432/${POSTGRES_DB:-boat_tour}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY:-change-me-in-production}
      DEBUG: "False"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./app:/app/app

volumes:
  postgres_data:
EOF
```

- [ ] **Step 3: Test complete stack**

```bash
cd bootstrap-manager-backend
docker-compose up -d
sleep 5

# Initialize database
docker-compose exec api python << 'PYEOF'
from app.db.database import Base, engine
from app.models import *
Base.metadata.create_all(bind=engine)
print("✓ Database initialized")
PYEOF

# Create test admin user
docker-compose exec api python << 'PYEOF'
from sqlalchemy.orm import sessionmaker
from app.db.database import engine
from app.models.db import User
from app.services.auth_service import AuthService
from app.domain.user import UserRole

Session = sessionmaker(bind=engine)
db = Session()

admin = User(
    email="admin@test.com",
    password_hash=AuthService.hash_password("password123"),
    name="Admin",
    role=UserRole.ADMIN
)
db.add(admin)
db.commit()
print(f"✓ Created admin user: admin@test.com / password123")
db.close()
PYEOF

# Test API
curl -s http://localhost:8000/health | jq .

# Stop containers
docker-compose down
```

Expected: Health check returns `{"status":"ok"}`

- [ ] **Step 4: Commit**

```bash
git add bootstrap-manager-backend/Dockerfile \
        bootstrap-manager-backend/docker-compose.yml
git commit -m "chore: add Docker configuration for deployment"
```

---

## Summary

**Backend:** ✅ 15 tasks
- Project setup, database, ORM models
- Auth service with JWT
- Repositories (database access)
- Services (business logic)
- 5 API route modules (auth, boats, captains, bookings, users)
- Tests for core features
- Docker setup

**Frontend:** ✅ 5 tasks
- API client with axios + interceptors
- TypeScript types
- Auth context & hooks
- Login/Register pages
- App integration with protected routes

**Total:** 20 tasks covering the complete implementation stack.

---

