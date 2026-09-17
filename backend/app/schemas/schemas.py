from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, TruckStatus, BookingStatus, TripStatus, RequestStatus, NotificationType


# ===================== AUTH SCHEMAS =====================

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.CUSTOMER


class DriverRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    license_number: str
    truck_number: str
    vehicle_type: str
    capacity: float
    goods_type: str
    current_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_routes: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class GoogleLoginRequest(BaseModel):
    code: str


# ===================== USER SCHEMAS =====================

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    role: UserRole
    first_login_completed: bool
    login_count: int
    last_login_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


# ===================== TRUCK SCHEMAS =====================

class TruckCreate(BaseModel):
    truck_number: str
    vehicle_type: str
    capacity: float
    goods_type: str
    current_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_routes: Optional[str] = None


class TruckUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    capacity: Optional[float] = None
    goods_type: Optional[str] = None
    current_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability_status: Optional[TruckStatus] = None
    preferred_routes: Optional[str] = None


class TruckResponse(BaseModel):
    id: int
    driver_id: int
    truck_number: str
    vehicle_type: str
    capacity: float
    goods_type: str
    current_location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    availability_status: TruckStatus
    trip_status: Optional[str]
    preferred_routes: Optional[str]
    last_updated: datetime
    created_at: datetime
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None

    class Config:
        from_attributes = True


class LocationUpdate(BaseModel):
    truck_id: int
    location_name: Optional[str] = None
    latitude: float
    longitude: float


# ===================== CUSTOMER REQUEST SCHEMAS =====================

class CustomerRequestCreate(BaseModel):
    pickup_location: str
    destination: str
    goods_type: str
    weight: float
    vehicle_type: Optional[str] = None
    required_capacity: Optional[float] = None
    pickup_date: Optional[str] = None
    pickup_time: Optional[str] = None


class CustomerRequestResponse(BaseModel):
    id: int
    customer_id: int
    pickup_location: str
    destination: str
    goods_type: str
    weight: float
    vehicle_type: Optional[str]
    required_capacity: Optional[float]
    pickup_date: Optional[str]
    pickup_time: Optional[str]
    status: RequestStatus
    created_at: datetime

    class Config:
        from_attributes = True


# ===================== MATCHING SCHEMAS =====================

class MatchingResultResponse(BaseModel):
    truck_id: int
    truck_number: str
    driver_name: str
    vehicle_type: str
    capacity: float
    goods_type: str
    current_location: Optional[str]
    preferred_routes: Optional[str]
    availability_status: TruckStatus
    route_score: float
    capacity_score: float
    vehicle_score: float
    goods_score: float
    availability_score: float
    distance_score: float
    timing_score: float
    total_score: float
    explanation: str
    latitude: Optional[float]
    longitude: Optional[float]
    driver_phone: Optional[str]

    class Config:
        from_attributes = True


# ===================== BOOKING SCHEMAS =====================

class BookingCreate(BaseModel):
    truck_id: int
    request_id: Optional[int] = None
    pickup_location: str
    destination: str
    goods_type: str
    weight: float
    pickup_date: Optional[str] = None
    pickup_time: Optional[str] = None
    notes: Optional[str] = None
    compatibility_score: Optional[float] = None


class BookingResponse(BaseModel):
    id: int
    customer_id: int
    truck_id: int
    request_id: Optional[int]
    pickup_location: str
    destination: str
    goods_type: str
    weight: float
    pickup_date: Optional[str]
    pickup_time: Optional[str]
    status: BookingStatus
    compatibility_score: Optional[float]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None
    truck_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None

    class Config:
        from_attributes = True


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


# ===================== TRIP SCHEMAS =====================

class TripResponse(BaseModel):
    id: int
    booking_id: int
    driver_id: int
    truck_id: int
    status: TripStatus
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    customer_name: Optional[str] = None
    pickup_location: Optional[str] = None
    destination: Optional[str] = None
    goods_type: Optional[str] = None

    class Config:
        from_attributes = True


class TripStatusUpdate(BaseModel):
    status: TripStatus


# ===================== NOTIFICATION SCHEMAS =====================

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    related_booking_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ===================== RATING SCHEMAS =====================

class RatingCreate(BaseModel):
    booking_id: int
    driver_rating: Optional[int] = Field(None, ge=1, le=5)
    customer_rating: Optional[int] = Field(None, ge=1, le=5)
    driver_feedback: Optional[str] = None
    customer_feedback: Optional[str] = None


class RatingResponse(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    driver_id: int
    customer_rating: Optional[int]
    driver_rating: Optional[int]
    customer_feedback: Optional[str]
    driver_feedback: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ===================== ADMIN SCHEMAS =====================

class DashboardStats(BaseModel):
    total_users: int
    total_customers: int
    total_drivers: int
    total_trucks: int
    available_trucks: int
    active_bookings: int
    completed_trips: int


# ===================== DRIVER DASHBOARD =====================

class DriverDashboardResponse(BaseModel):
    truck: Optional[TruckResponse]
    pending_requests: List[BookingResponse]
    active_trip: Optional[TripResponse]
    completed_trips_count: int
    total_requests: int
