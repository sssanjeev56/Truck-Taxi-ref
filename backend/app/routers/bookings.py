from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.models import (
    Booking, Truck, Customer, User, BookingStatus, TruckStatus, NotificationType, Driver
)
from app.schemas.schemas import BookingCreate, BookingResponse, BookingStatusUpdate
from app.utils.dependencies import get_current_user
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _booking_to_response(b: Booking) -> BookingResponse:
    truck = b.truck
    driver_user = truck.driver.user if truck and truck.driver else None
    cust_user = b.customer.user if b.customer else None
    return BookingResponse(
        id=b.id,
        customer_id=b.customer_id,
        truck_id=b.truck_id,
        request_id=b.request_id,
        pickup_location=b.pickup_location,
        destination=b.destination,
        goods_type=b.goods_type,
        weight=b.weight,
        pickup_date=b.pickup_date,
        pickup_time=b.pickup_time,
        status=b.status,
        compatibility_score=b.compatibility_score,
        notes=b.notes,
        created_at=b.created_at,
        updated_at=b.updated_at,
        customer_name=cust_user.full_name if cust_user else None,
        truck_number=truck.truck_number if truck else None,
        driver_name=driver_user.full_name if driver_user else None,
        driver_phone=driver_user.phone if driver_user else None,
    )


@router.post("", response_model=BookingResponse, status_code=201)
def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    truck = db.query(Truck).filter(Truck.id == data.truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    if truck.availability_status not in [TruckStatus.AVAILABLE, TruckStatus.DELIVERED]:
        raise HTTPException(status_code=400, detail="This truck is not available for booking")

    # Check if customer already has a pending booking for this truck
    existing = db.query(Booking).filter(
        Booking.customer_id == customer.id,
        Booking.truck_id == truck.id,
        Booking.status == BookingStatus.PENDING,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending booking for this truck")

    booking = Booking(
        customer_id=customer.id,
        truck_id=truck.id,
        request_id=data.request_id,
        pickup_location=data.pickup_location,
        destination=data.destination,
        goods_type=data.goods_type,
        weight=data.weight,
        pickup_date=data.pickup_date,
        pickup_time=data.pickup_time,
        notes=data.notes,
        compatibility_score=data.compatibility_score,
        status=BookingStatus.PENDING,
    )
    db.add(booking)
    db.flush()

    # Notify driver
    driver = truck.driver
    driver_user = driver.user if driver else None
    if driver_user:
        create_notification(
            db=db,
            user_id=driver_user.id,
            notif_type=NotificationType.BOOKING_REQUEST,
            title="New Booking Request!",
            message=f"{current_user.full_name} wants to book your truck {truck.truck_number} for transport from {data.pickup_location} to {data.destination}.",
            related_booking_id=booking.id,
        )

    db.commit()
    db.refresh(booking)
    return _booking_to_response(booking)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check access
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()

    has_access = False
    if customer and booking.customer_id == customer.id:
        has_access = True
    if driver:
        truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
        if truck and booking.truck_id == truck.id:
            has_access = True
    if current_user.role.value == "admin":
        has_access = True

    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    return _booking_to_response(booking)


@router.put("/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    data: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Only customer can cancel their own booking
    if data.status == BookingStatus.CANCELLED:
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if not customer or booking.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="Only the booking customer can cancel")
        booking.status = data.status

        # Notify driver
        truck = booking.truck
        if truck and truck.driver and truck.driver.user:
            create_notification(
                db=db,
                user_id=truck.driver.user.id,
                notif_type=NotificationType.BOOKING_CANCELLED,
                title="Booking Cancelled",
                message=f"Customer {current_user.full_name} has cancelled booking #{booking_id}.",
                related_booking_id=booking_id,
            )

    db.commit()
    return {"message": f"Booking status updated to {data.status}", "booking_id": booking_id}
