from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.models import User, Customer, CustomerRequest, Booking, Truck, MatchingResult, TruckStatus, RequestStatus
from app.schemas.schemas import CustomerRequestCreate, CustomerRequestResponse, BookingResponse, MatchingResultResponse
from app.utils.dependencies import get_current_user
from app.services.matching_engine import match_trucks, calculate_compatibility
from app.services.ai_service import generate_match_explanation
from app.services.notification_service import create_notification
from app.models.models import NotificationType

router = APIRouter(prefix="/api/customer", tags=["customer"])


def _get_customer(db: Session, user: User) -> Customer:
    customer = db.query(Customer).filter(Customer.user_id == user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return customer


@router.get("/dashboard")
def customer_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = _get_customer(db, current_user)

    available_trucks = db.query(Truck).filter(Truck.availability_status == TruckStatus.AVAILABLE).count()
    active_bookings = db.query(Booking).filter(
        Booking.customer_id == customer.id,
        Booking.status.in_(["pending", "confirmed", "in_transit"])
    ).count()
    pending_requests = db.query(Booking).filter(
        Booking.customer_id == customer.id,
        Booking.status == "pending"
    ).count()
    completed_trips = db.query(Booking).filter(
        Booking.customer_id == customer.id,
        Booking.status == "completed"
    ).count()

    is_first_login = current_user.login_count <= 1

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "is_first_login": is_first_login,
        "stats": {
            "available_trucks": available_trucks,
            "active_bookings": active_bookings,
            "pending_requests": pending_requests,
            "completed_trips": completed_trips,
        },
    }


@router.post("/request", response_model=CustomerRequestResponse, status_code=201)
def create_request(
    request_data: CustomerRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = _get_customer(db, current_user)
    req = CustomerRequest(
        customer_id=customer.id,
        pickup_location=request_data.pickup_location,
        destination=request_data.destination,
        goods_type=request_data.goods_type,
        weight=request_data.weight,
        vehicle_type=request_data.vehicle_type,
        required_capacity=request_data.required_capacity,
        pickup_date=request_data.pickup_date,
        pickup_time=request_data.pickup_time,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/recommendations/{request_id}", response_model=List[MatchingResultResponse])
def get_recommendations(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = _get_customer(db, current_user)
    req = db.query(CustomerRequest).filter(
        CustomerRequest.id == request_id,
        CustomerRequest.customer_id == customer.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    results = match_trucks(req, db)

    # Store matching results in DB
    db.query(MatchingResult).filter(MatchingResult.request_id == request_id).delete()
    for r in results:
        truck = db.query(Truck).filter(Truck.id == r["truck_id"]).first()
        explanation = generate_match_explanation(
            truck_number=r["truck_number"],
            driver_name=r["driver_name"],
            scores=r,
            truck_location=r.get("current_location"),
            request_pickup=req.pickup_location,
            request_destination=req.destination,
            capacity=r["capacity"],
            required_weight=req.weight,
            goods_type=req.goods_type,
            preferred_routes=r.get("preferred_routes"),
        )
        mr = MatchingResult(
            request_id=request_id,
            truck_id=r["truck_id"],
            route_score=r["route_score"],
            capacity_score=r["capacity_score"],
            vehicle_score=r["vehicle_score"],
            goods_score=r["goods_score"],
            availability_score=r["availability_score"],
            distance_score=r["distance_score"],
            timing_score=r["timing_score"],
            total_score=r["total_score"],
            explanation=explanation,
        )
        r["explanation"] = explanation
        db.add(mr)
    db.commit()

    # Add explanations to results
    if not results:
        return []
    return [MatchingResultResponse(**r) for r in results]


@router.post("/find-trucks", response_model=List[MatchingResultResponse])
def find_trucks(
    request_data: CustomerRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a request and immediately find matching trucks."""
    customer = _get_customer(db, current_user)
    req = CustomerRequest(
        customer_id=customer.id,
        pickup_location=request_data.pickup_location,
        destination=request_data.destination,
        goods_type=request_data.goods_type,
        weight=request_data.weight,
        vehicle_type=request_data.vehicle_type,
        required_capacity=request_data.required_capacity,
        pickup_date=request_data.pickup_date,
        pickup_time=request_data.pickup_time,
    )
    db.add(req)
    db.flush()

    results = match_trucks(req, db)

    for r in results:
        explanation = generate_match_explanation(
            truck_number=r["truck_number"],
            driver_name=r["driver_name"],
            scores=r,
            truck_location=r.get("current_location"),
            request_pickup=req.pickup_location,
            request_destination=req.destination,
            capacity=r["capacity"],
            required_weight=req.weight,
            goods_type=req.goods_type,
            preferred_routes=r.get("preferred_routes"),
        )
        mr = MatchingResult(
            request_id=req.id,
            truck_id=r["truck_id"],
            route_score=r["route_score"],
            capacity_score=r["capacity_score"],
            vehicle_score=r["vehicle_score"],
            goods_score=r["goods_score"],
            availability_score=r["availability_score"],
            distance_score=r["distance_score"],
            timing_score=r["timing_score"],
            total_score=r["total_score"],
            explanation=explanation,
        )
        r["explanation"] = explanation
        db.add(mr)

    db.commit()
    db.refresh(req)

    if not results:
        return []
    return [MatchingResultResponse(**r) for r in results]


@router.get("/bookings", response_model=List[BookingResponse])
def get_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = _get_customer(db, current_user)
    bookings = db.query(Booking).filter(Booking.customer_id == customer.id).order_by(Booking.created_at.desc()).all()

    result = []
    for b in bookings:
        truck = b.truck
        driver_user = truck.driver.user if truck and truck.driver else None
        result.append(BookingResponse(
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
            customer_name=current_user.full_name,
            truck_number=truck.truck_number if truck else None,
            driver_name=driver_user.full_name if driver_user else None,
            driver_phone=driver_user.phone if driver_user else None,
        ))
    return result
