from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.db import get_db
from app.models.models import (
    User, Driver, Truck, Booking, Trip, TruckStatus, BookingStatus, TripStatus,
    Customer, CustomerRequest, NotificationType, RequestStatus
)
from app.schemas.schemas import (
    TruckUpdate, TruckResponse, BookingResponse, TripResponse, TripStatusUpdate, DriverDashboardResponse
)
from app.utils.dependencies import get_current_user
from app.services.notification_service import create_notification
from app.services.matching_engine import find_return_loads

router = APIRouter(prefix="/api/driver", tags=["driver"])


def _get_driver(db: Session, user: User) -> Driver:
    driver = db.query(Driver).filter(Driver.user_id == user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return driver


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


@router.get("/dashboard")
def driver_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    driver = _get_driver(db, current_user)
    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()

    pending_bookings = db.query(Booking).filter(
        Booking.truck_id == truck.id if truck else -1,
        Booking.status == BookingStatus.PENDING
    ).all() if truck else []

    active_trip = db.query(Trip).filter(
        Trip.driver_id == driver.id,
        Trip.status.in_([TripStatus.LOADING, TripStatus.IN_TRANSIT])
    ).first()

    completed_count = db.query(Trip).filter(
        Trip.driver_id == driver.id,
        Trip.status == TripStatus.COMPLETED
    ).count()

    is_first_login = current_user.login_count <= 1

    truck_data = None
    if truck:
        truck_data = {
            "id": truck.id,
            "truck_number": truck.truck_number,
            "vehicle_type": truck.vehicle_type,
            "capacity": truck.capacity,
            "goods_type": truck.goods_type,
            "current_location": truck.current_location,
            "latitude": truck.latitude,
            "longitude": truck.longitude,
            "availability_status": truck.availability_status,
            "trip_status": truck.trip_status,
            "preferred_routes": truck.preferred_routes,
            "last_updated": truck.last_updated,
        }

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "is_first_login": is_first_login,
        "truck": truck_data,
        "pending_requests_count": len(pending_bookings),
        "pending_bookings": [_booking_to_response(b).model_dump() for b in pending_bookings],
        "active_trip": {
            "id": active_trip.id,
            "status": active_trip.status,
            "booking_id": active_trip.booking_id,
        } if active_trip else None,
        "completed_trips": completed_count,
    }


@router.get("/truck", response_model=Optional[TruckResponse])
def get_my_truck(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    driver = _get_driver(db, current_user)
    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
    if not truck:
        return None
    driver_user = truck.driver.user if truck.driver else None
    return TruckResponse(
        **{c.name: getattr(truck, c.name) for c in truck.__table__.columns},
        driver_name=driver_user.full_name if driver_user else None,
        driver_phone=driver_user.phone if driver_user else None,
    )


@router.put("/truck", response_model=TruckResponse)
def update_truck(
    data: TruckUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)
    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(truck, k, v)
    truck.last_updated = datetime.now(timezone.utc)

    db.commit()
    db.refresh(truck)
    driver_user = truck.driver.user if truck.driver else None
    return TruckResponse(
        **{c.name: getattr(truck, c.name) for c in truck.__table__.columns},
        driver_name=driver_user.full_name if driver_user else None,
        driver_phone=driver_user.phone if driver_user else None,
    )


@router.put("/availability")
def set_availability(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)
    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    status_val = data.get("status", "available")
    try:
        truck.availability_status = TruckStatus(status_val)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status_val}")

    truck.last_updated = datetime.now(timezone.utc)
    db.commit()
    return {"message": f"Availability set to {status_val}", "status": status_val}


@router.put("/location")
def update_location(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)
    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    truck.current_location = data.get("location_name", truck.current_location)
    if data.get("latitude"):
        truck.latitude = data["latitude"]
    if data.get("longitude"):
        truck.longitude = data["longitude"]
    truck.last_updated = datetime.now(timezone.utc)

    db.commit()
    return {"message": "Location updated", "location": truck.current_location}


@router.get("/requests", response_model=List[BookingResponse])
def get_booking_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    driver = _get_driver(db, current_user)
    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
    if not truck:
        return []

    bookings = db.query(Booking).filter(
        Booking.truck_id == truck.id,
        Booking.status == BookingStatus.PENDING
    ).order_by(Booking.created_at.desc()).all()

    return [_booking_to_response(b) for b in bookings]


@router.post("/request/{booking_id}/accept")
def accept_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)
    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.truck_id == truck.id,
        Booking.status == BookingStatus.PENDING
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking request not found")

    booking.status = BookingStatus.CONFIRMED
    truck.availability_status = TruckStatus.LOADING
    truck.last_updated = datetime.now(timezone.utc)

    # Create trip
    trip = Trip(
        booking_id=booking.id,
        driver_id=driver.id,
        truck_id=truck.id,
        status=TripStatus.LOADING,
    )
    db.add(trip)

    # Notify customer
    cust_user = booking.customer.user if booking.customer else None
    if cust_user:
        create_notification(
            db=db,
            user_id=cust_user.id,
            notif_type=NotificationType.BOOKING_CONFIRMED,
            title="Booking Confirmed!",
            message=f"Your booking has been accepted by {current_user.full_name}. Truck {truck.truck_number} is now confirmed for your journey.",
            related_booking_id=booking.id,
        )

    db.commit()
    return {"message": "Booking accepted", "booking_id": booking_id, "trip_status": "loading"}


@router.post("/request/{booking_id}/reject")
def reject_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)
    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.truck_id == truck.id,
        Booking.status == BookingStatus.PENDING
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking request not found")

    booking.status = BookingStatus.REJECTED

    # Notify customer
    cust_user = booking.customer.user if booking.customer else None
    if cust_user:
        create_notification(
            db=db,
            user_id=cust_user.id,
            notif_type=NotificationType.BOOKING_REJECTED,
            title="Booking Rejected",
            message=f"Your booking request was rejected by the driver. Please find another truck.",
            related_booking_id=booking.id,
        )

    db.commit()
    return {"message": "Booking rejected", "booking_id": booking_id}


@router.get("/trips", response_model=List[TripResponse])
def get_trips(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    driver = _get_driver(db, current_user)
    trips = db.query(Trip).filter(Trip.driver_id == driver.id).order_by(Trip.created_at.desc()).all()

    result = []
    for t in trips:
        booking = t.booking
        cust_user = booking.customer.user if booking and booking.customer else None
        result.append(TripResponse(
            id=t.id,
            booking_id=t.booking_id,
            driver_id=t.driver_id,
            truck_id=t.truck_id,
            status=t.status,
            started_at=t.started_at,
            completed_at=t.completed_at,
            created_at=t.created_at,
            customer_name=cust_user.full_name if cust_user else None,
            pickup_location=booking.pickup_location if booking else None,
            destination=booking.destination if booking else None,
            goods_type=booking.goods_type if booking else None,
        ))
    return result


@router.put("/trip/{trip_id}/status")
def update_trip_status(
    trip_id: int,
    data: TripStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    driver = _get_driver(db, current_user)
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.driver_id == driver.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.status = data.status
    truck = trip.truck
    booking = trip.booking
    now = datetime.now(timezone.utc)

    if data.status == TripStatus.IN_TRANSIT:
        trip.started_at = now
        if truck:
            truck.availability_status = TruckStatus.IN_TRANSIT
            truck.last_updated = now
        if booking:
            booking.status = BookingStatus.IN_TRANSIT
        # Notify customer
        if booking and booking.customer and booking.customer.user:
            create_notification(
                db=db,
                user_id=booking.customer.user.id,
                notif_type=NotificationType.TRIP_STARTED,
                title="Trip Started",
                message=f"Truck {truck.truck_number if truck else ''} has started your journey from {booking.pickup_location} to {booking.destination}.",
                related_booking_id=booking.id,
            )

    elif data.status == TripStatus.DELIVERED:
        if truck:
            truck.availability_status = TruckStatus.DELIVERED
            truck.last_updated = now

    elif data.status == TripStatus.COMPLETED:
        trip.completed_at = now
        if truck:
            truck.availability_status = TruckStatus.AVAILABLE
            truck.last_updated = now
            if booking:
                truck.current_location = booking.destination
        if booking:
            booking.status = BookingStatus.COMPLETED

        if truck:
            driver_obj = db.query(Driver).filter(Driver.id == driver.id).first()
            if driver_obj:
                driver_obj.total_trips = (driver_obj.total_trips or 0) + 1

        # Notify driver and customer
        if booking and booking.customer and booking.customer.user:
            create_notification(
                db=db,
                user_id=booking.customer.user.id,
                notif_type=NotificationType.TRIP_COMPLETED,
                title="Trip Completed!",
                message=f"Your goods have been delivered to {booking.destination}. Trip completed successfully.",
                related_booking_id=booking.id,
            )

        # Check for return loads
        if truck:
            return_loads = find_return_loads(truck, db)
            if return_loads:
                create_notification(
                    db=db,
                    user_id=current_user.id,
                    notif_type=NotificationType.RETURN_LOAD,
                    title="Return Load Opportunity!",
                    message=f"Your truck is now available in {truck.current_location}. {len(return_loads)} return load opportunity(ies) found nearby!",
                )

    db.commit()
    return {"message": f"Trip status updated to {data.status}", "trip_id": trip_id}


@router.get("/return-loads")
def get_return_loads(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    driver = _get_driver(db, current_user)
    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
    if not truck:
        return {"return_loads": [], "message": "No truck registered"}

    loads = find_return_loads(truck, db)
    return {"return_loads": loads, "truck_location": truck.current_location}
