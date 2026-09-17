from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.models import (
    User, Customer, Driver, Truck, Booking, Trip, Rating,
    TruckStatus, BookingStatus, TripStatus, UserRole
)
from app.schemas.schemas import UserResponse, TruckResponse, BookingResponse, RatingCreate, RatingResponse
from app.utils.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard")
def admin_dashboard(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()
    total_customers = db.query(Customer).count()
    total_drivers = db.query(Driver).count()
    total_trucks = db.query(Truck).count()
    available_trucks = db.query(Truck).filter(Truck.availability_status == TruckStatus.AVAILABLE).count()
    active_bookings = db.query(Booking).filter(
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_TRANSIT])
    ).count()
    completed_trips = db.query(Trip).filter(Trip.status == TripStatus.COMPLETED).count()

    # Vehicle type distribution
    trucks = db.query(Truck).all()
    vehicle_dist = {}
    for t in trucks:
        vt = t.vehicle_type
        vehicle_dist[vt] = vehicle_dist.get(vt, 0) + 1

    # Booking status distribution
    bookings = db.query(Booking).all()
    booking_dist = {}
    for b in bookings:
        s = b.status.value
        booking_dist[s] = booking_dist.get(s, 0) + 1

    return {
        "stats": {
            "total_users": total_users,
            "total_customers": total_customers,
            "total_drivers": total_drivers,
            "total_trucks": total_trucks,
            "available_trucks": available_trucks,
            "active_bookings": active_bookings,
            "completed_trips": completed_trips,
        },
        "vehicle_distribution": vehicle_dist,
        "booking_distribution": booking_dist,
    }


@router.get("/users")
def get_all_users(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "login_count": u.login_count,
            "last_login_at": u.last_login_at,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.get("/drivers")
def get_all_drivers(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    drivers = db.query(Driver).all()
    result = []
    for d in drivers:
        user = d.user
        trucks = d.trucks
        result.append({
            "id": d.id,
            "user_id": d.user_id,
            "full_name": user.full_name if user else None,
            "email": user.email if user else None,
            "phone": user.phone if user else None,
            "license_number": d.license_number,
            "rating": d.rating,
            "total_trips": d.total_trips,
            "trucks": [
                {"id": t.id, "truck_number": t.truck_number, "status": t.availability_status}
                for t in trucks
            ],
        })
    return result


@router.get("/trucks")
def get_all_trucks(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    trucks = db.query(Truck).all()
    result = []
    for t in trucks:
        driver = t.driver
        driver_user = driver.user if driver else None
        result.append({
            "id": t.id,
            "truck_number": t.truck_number,
            "vehicle_type": t.vehicle_type,
            "capacity": t.capacity,
            "goods_type": t.goods_type,
            "current_location": t.current_location,
            "availability_status": t.availability_status,
            "driver_name": driver_user.full_name if driver_user else None,
            "driver_phone": driver_user.phone if driver_user else None,
            "last_updated": t.last_updated,
        })
    return result


@router.get("/bookings")
def get_all_bookings(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(100).all()
    result = []
    for b in bookings:
        truck = b.truck
        driver_user = truck.driver.user if truck and truck.driver else None
        cust_user = b.customer.user if b.customer else None
        result.append({
            "id": b.id,
            "customer_name": cust_user.full_name if cust_user else None,
            "driver_name": driver_user.full_name if driver_user else None,
            "truck_number": truck.truck_number if truck else None,
            "pickup_location": b.pickup_location,
            "destination": b.destination,
            "goods_type": b.goods_type,
            "weight": b.weight,
            "pickup_date": b.pickup_date,
            "status": b.status,
            "compatibility_score": b.compatibility_score,
            "created_at": b.created_at,
        })
    return result


@router.get("/trips")
def get_all_trips(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    trips = db.query(Trip).order_by(Trip.created_at.desc()).limit(100).all()
    result = []
    for t in trips:
        booking = t.booking
        cust_user = booking.customer.user if booking and booking.customer else None
        truck = t.truck
        driver_user = truck.driver.user if truck and truck.driver else None
        result.append({
            "id": t.id,
            "status": t.status,
            "customer_name": cust_user.full_name if cust_user else None,
            "driver_name": driver_user.full_name if driver_user else None,
            "truck_number": truck.truck_number if truck else None,
            "pickup_location": booking.pickup_location if booking else None,
            "destination": booking.destination if booking else None,
            "started_at": t.started_at,
            "completed_at": t.completed_at,
            "created_at": t.created_at,
        })
    return result


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}
