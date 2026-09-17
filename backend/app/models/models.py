from app.database.db import Base
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum


# ===================== ENUMS =====================

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    DRIVER = "driver"
    ADMIN = "admin"


class TruckStatus(str, enum.Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    LOADING = "loading"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    OFFLINE = "offline"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class TripStatus(str, enum.Enum):
    LOADING = "loading"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    COMPLETED = "completed"


class RequestStatus(str, enum.Enum):
    OPEN = "open"
    MATCHED = "matched"
    BOOKED = "booked"
    CANCELLED = "cancelled"


class NotificationType(str, enum.Enum):
    BOOKING_REQUEST = "booking_request"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_REJECTED = "booking_rejected"
    TRIP_STARTED = "trip_started"
    TRIP_COMPLETED = "trip_completed"
    TRUCK_AVAILABLE = "truck_available"
    RETURN_LOAD = "return_load"
    BOOKING_CANCELLED = "booking_cancelled"
    GENERAL = "general"


# ===================== MODELS =====================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(256), nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    first_login_completed = Column(Boolean, default=False)
    login_count = Column(Integer, default=0)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    google_id = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("Customer", back_populates="user", uselist=False)
    driver = relationship("Driver", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")
    login_history = relationship("LoginHistory", back_populates="user")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="customer")
    requests = relationship("CustomerRequest", back_populates="customer")
    bookings = relationship("Booking", back_populates="customer")
    ratings_given = relationship("Rating", back_populates="customer", foreign_keys="Rating.customer_id")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    license_number = Column(String(100), nullable=False)
    rating = Column(Float, default=0.0)
    total_trips = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="driver")
    trucks = relationship("Truck", back_populates="driver")
    trips = relationship("Trip", back_populates="driver")
    ratings_received = relationship("Rating", back_populates="driver", foreign_keys="Rating.driver_id")


class Truck(Base):
    __tablename__ = "trucks"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    truck_number = Column(String(50), unique=True, nullable=False)
    vehicle_type = Column(String(100), nullable=False)
    capacity = Column(Float, nullable=False)  # in tons
    goods_type = Column(String(200), nullable=False)
    current_location = Column(String(200), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    availability_status = Column(Enum(TruckStatus), default=TruckStatus.AVAILABLE)
    trip_status = Column(String(100), nullable=True)
    preferred_routes = Column(Text, nullable=True)  # JSON string
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    driver = relationship("Driver", back_populates="trucks")
    bookings = relationship("Booking", back_populates="truck")
    trips = relationship("Trip", back_populates="truck")
    locations = relationship("TruckLocation", back_populates="truck")
    matching_results = relationship("MatchingResult", back_populates="truck")


class TruckLocation(Base):
    __tablename__ = "truck_locations"

    id = Column(Integer, primary_key=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False)
    location_name = Column(String(200), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    truck = relationship("Truck", back_populates="locations")


class CustomerRequest(Base):
    __tablename__ = "customer_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    pickup_location = Column(String(200), nullable=False)
    destination = Column(String(200), nullable=False)
    goods_type = Column(String(200), nullable=False)
    weight = Column(Float, nullable=False)  # in tons
    vehicle_type = Column(String(100), nullable=True)
    required_capacity = Column(Float, nullable=True)
    pickup_date = Column(String(50), nullable=True)
    pickup_time = Column(String(50), nullable=True)
    status = Column(Enum(RequestStatus), default=RequestStatus.OPEN)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("Customer", back_populates="requests")
    bookings = relationship("Booking", back_populates="request")
    matching_results = relationship("MatchingResult", back_populates="request")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False)
    request_id = Column(Integer, ForeignKey("customer_requests.id"), nullable=True)
    pickup_location = Column(String(200), nullable=False)
    destination = Column(String(200), nullable=False)
    goods_type = Column(String(200), nullable=False)
    weight = Column(Float, nullable=False)
    pickup_date = Column(String(50), nullable=True)
    pickup_time = Column(String(50), nullable=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    compatibility_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("Customer", back_populates="bookings")
    truck = relationship("Truck", back_populates="bookings")
    request = relationship("CustomerRequest", back_populates="bookings")
    trip = relationship("Trip", back_populates="booking", uselist=False)
    ratings = relationship("Rating", back_populates="booking")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False)
    status = Column(Enum(TripStatus), default=TripStatus.LOADING)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    booking = relationship("Booking", back_populates="trip")
    driver = relationship("Driver", back_populates="trips")
    truck = relationship("Truck", back_populates="trips")


class MatchingResult(Base):
    __tablename__ = "matching_results"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("customer_requests.id"), nullable=False)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False)
    route_score = Column(Float, default=0)
    capacity_score = Column(Float, default=0)
    vehicle_score = Column(Float, default=0)
    goods_score = Column(Float, default=0)
    availability_score = Column(Float, default=0)
    distance_score = Column(Float, default=0)
    timing_score = Column(Float, default=0)
    total_score = Column(Float, default=0)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    request = relationship("CustomerRequest", back_populates="matching_results")
    truck = relationship("Truck", back_populates="matching_results")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.GENERAL)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    related_booking_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="notifications")


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    login_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ip_address = Column(String(50), nullable=True)
    login_method = Column(String(50), default="email")

    # Relationships
    user = relationship("User", back_populates="login_history")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    customer_rating = Column(Integer, nullable=True)  # Driver rating customer
    driver_rating = Column(Integer, nullable=True)    # Customer rating driver
    customer_feedback = Column(Text, nullable=True)
    driver_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    booking = relationship("Booking", back_populates="ratings")
    customer = relationship("Customer", back_populates="ratings_given", foreign_keys=[customer_id])
    driver = relationship("Driver", back_populates="ratings_received", foreign_keys=[driver_id])
