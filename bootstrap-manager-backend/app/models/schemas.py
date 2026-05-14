"""Pydantic schemas for request and response models"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.domain.user import UserRole
from app.domain.booking import BookingStatus


# ============================================================================
# User Schemas
# ============================================================================

class UserCreate(BaseModel):
    """Schema for creating a new user"""

    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=255)
    role: UserRole = UserRole.CUSTOMER


class UserUpdate(BaseModel):
    """Schema for updating user information"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)


class UserRoleUpdate(BaseModel):
    """Schema for updating user role (admin only)"""

    role: UserRole


class UserResponse(BaseModel):
    """Schema for user response"""

    id: int
    email: str
    name: str
    role: UserRole
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Token Schemas
# ============================================================================

class TokenResponse(BaseModel):
    """Schema for token response"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Schema for token refresh request"""

    refresh_token: str


# ============================================================================
# Boat Schemas
# ============================================================================

class BoatCreate(BaseModel):
    """Schema for creating a new boat"""

    name: str = Field(..., min_length=1, max_length=255)
    capacity: int = Field(..., gt=0)
    boat_type: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    available: bool = True


class BoatUpdate(BaseModel):
    """Schema for updating boat information"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    capacity: Optional[int] = Field(None, gt=0)
    boat_type: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    available: Optional[bool] = None


class BoatResponse(BaseModel):
    """Schema for boat response"""

    id: int
    name: str
    capacity: int
    boat_type: str
    description: Optional[str]
    available: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BoatAvailability(BaseModel):
    """Schema for boat availability information"""

    boat_id: int
    boat_name: str
    capacity: int
    available_from: datetime
    available_until: datetime


# ============================================================================
# Captain Schemas
# ============================================================================

class CaptainCreate(BaseModel):
    """Schema for creating a new captain"""

    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=20)
    certifications: Optional[str] = Field(None, max_length=500)


class CaptainUpdate(BaseModel):
    """Schema for updating captain information"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=1, max_length=20)
    certifications: Optional[str] = Field(None, max_length=500)


class CaptainResponse(BaseModel):
    """Schema for captain response"""

    id: int
    name: str
    email: str
    phone: str
    certifications: Optional[str]
    available_boats: List[int] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaptainBoatsUpdate(BaseModel):
    """Schema for updating captain's boats"""

    boat_ids: List[int] = Field(..., min_items=0)


# ============================================================================
# Booking Schemas
# ============================================================================

class CustomerInfo(BaseModel):
    """Schema for customer information in booking"""

    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=20)


class BookingCreate(BaseModel):
    """Schema for creating a new booking"""

    boat_id: int
    captain_id: Optional[int] = None
    start_date: datetime
    end_date: datetime
    participants: int = Field(..., gt=0)
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: EmailStr
    customer_phone: str = Field(..., min_length=1, max_length=20)
    tour_type: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=1000)
    catering: bool = False
    booking_kind: str = Field("charter", pattern="^(charter|public)$")
    payment_status: str = Field("unpaid", pattern="^(unpaid|paid|pay_on_site|refunded)$")
    status: Optional[BookingStatus] = None


class BookingUpdate(BaseModel):
    """Schema for updating a booking"""

    boat_id: Optional[int] = None
    captain_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    participants: Optional[int] = Field(None, gt=0)
    customer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = Field(None, min_length=1, max_length=20)
    tour_type: Optional[str] = Field(None, max_length=50)
    status: Optional[BookingStatus] = None
    notes: Optional[str] = Field(None, max_length=1000)
    catering: Optional[bool] = None
    payment_status: Optional[str] = Field(None, pattern="^(unpaid|paid|pay_on_site|refunded)$")


class BookingResponse(BaseModel):
    """Schema for booking response"""

    id: int
    boat_id: int
    captain_id: Optional[int]
    created_by_id: int
    start_date: datetime
    end_date: datetime
    participants: int
    customer_name: str
    customer_email: str
    customer_phone: str
    tour_type: Optional[str]
    status: BookingStatus
    notes: Optional[str]
    catering: bool = False
    booking_kind: str = "charter"
    total_price: float = 0.0
    payment_status: str = "unpaid"
    public_tour_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookingAvailabilityCheck(BaseModel):
    """Schema for checking booking availability"""

    boat_id: int
    start_date: datetime
    end_date: datetime
    participants: Optional[int] = None


class AvailabilityResponse(BaseModel):
    """Schema for availability check response"""

    is_available: bool
    boat_id: int
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None
    available_captains: List[int] = []


# ============================================================================
# TourType / PublicTour / Absence Schemas
# ============================================================================

class TourTypeCreate(BaseModel):
    slug: str = Field(..., min_length=1, max_length=120)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    duration_minutes: int = Field(..., gt=0)
    price_per_ticket: float = Field(..., ge=0)
    min_participants: int = Field(1, ge=1)
    max_participants: int = Field(50, ge=1)
    image_url: Optional[str] = Field(None, max_length=500)
    active: bool = True
    category: str = Field("rundfahrt", pattern="^(rundfahrt|event)$")


class TourTypeUpdate(BaseModel):
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    duration_minutes: Optional[int] = Field(None, gt=0)
    price_per_ticket: Optional[float] = Field(None, ge=0)
    min_participants: Optional[int] = Field(None, ge=1)
    max_participants: Optional[int] = Field(None, ge=1)
    image_url: Optional[str] = Field(None, max_length=500)
    active: Optional[bool] = None
    category: Optional[str] = Field(None, pattern="^(rundfahrt|event)$")


class TourTypeResponse(BaseModel):
    id: int
    slug: str
    name: str
    description: Optional[str]
    duration_minutes: int
    price_per_ticket: float
    min_participants: int
    max_participants: int
    image_url: Optional[str]
    active: bool
    category: str = "rundfahrt"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PublicTourCreate(BaseModel):
    tour_type_id: int
    boat_id: int
    captain_id: Optional[int] = None  # auto-assigned if not provided
    start_date: datetime
    end_date: datetime
    seats_total: int = Field(..., gt=0)


class PublicTourUpdate(BaseModel):
    boat_id: Optional[int] = None
    captain_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    seats_total: Optional[int] = Field(None, gt=0)
    tour_type_id: Optional[int] = None


class PublicTourCancel(BaseModel):
    reason: str = Field(..., min_length=1, max_length=500)


class PublicTourSeriesCreate(BaseModel):
    tour_type_id: int
    boat_id: int
    captain_id: Optional[int] = None
    seats_total: int = Field(..., gt=0)
    series_start: datetime  # date from
    series_end: datetime  # date until (inclusive)
    weekdays: Optional[List[int]] = None  # 0=Mon..6=Sun, None = all days
    times: List[str] = Field(..., min_items=1)  # ["10:00", "14:30"] - one slot per time per day
    duration_minutes: int = Field(90, gt=0)


class PublicTourResponse(BaseModel):
    id: int
    tour_type_id: int
    boat_id: int
    captain_id: Optional[int]
    start_date: datetime
    end_date: datetime
    seats_total: int
    seats_booked: int
    status: str
    cancellation_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TicketPurchase(BaseModel):
    public_tour_id: int
    quantity: int = Field(..., gt=0)
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: EmailStr
    customer_phone: str = Field(..., min_length=1, max_length=20)
    catering: bool = False
    notes: Optional[str] = Field(None, max_length=1000)
    payment_method: str = Field("online", pattern="^(online|onsite)$")


class CharterRequest(BaseModel):
    """Public charter request (no auth required)"""
    boat_id: int
    start_date: datetime
    end_date: datetime
    participants: int = Field(..., gt=0)
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: EmailStr
    customer_phone: str = Field(..., min_length=1, max_length=20)
    catering: bool = False
    notes: Optional[str] = Field(None, max_length=1000)
    tour_type: Optional[str] = Field(None, max_length=50)
    payment_method: str = Field("online", pattern="^(online|onsite)$")
    tour_type_slug: Optional[str] = Field(None, max_length=50)


class CaptainAbsenceCreate(BaseModel):
    start_date: datetime
    end_date: datetime
    reason: str = Field("vacation", pattern="^(vacation|sick|permanent|other)$")
    notes: Optional[str] = Field(None, max_length=500)


class CaptainAbsenceResponse(BaseModel):
    id: int
    captain_id: int
    start_date: datetime
    end_date: datetime
    reason: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
