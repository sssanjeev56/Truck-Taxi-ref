from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.models import Truck, TruckStatus, User
from app.schemas.schemas import TruckResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/trucks", tags=["trucks"])


@router.get("", response_model=List[TruckResponse])
def get_available_trucks(db: Session = Depends(get_db)):
    trucks = db.query(Truck).filter(
        Truck.availability_status == TruckStatus.AVAILABLE
    ).all()
    result = []
    for t in trucks:
        driver_user = t.driver.user if t.driver else None
        result.append(TruckResponse(
            **{c.name: getattr(t, c.name) for c in t.__table__.columns},
            driver_name=driver_user.full_name if driver_user else None,
            driver_phone=driver_user.phone if driver_user else None,
        ))
    return result


@router.get("/{truck_id}")
def get_truck_detail(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    driver = truck.driver
    driver_user = driver.user if driver else None

    return {
        "id": truck.id,
        "truck_number": truck.truck_number,
        "vehicle_type": truck.vehicle_type,
        "capacity": truck.capacity,
        "goods_type": truck.goods_type,
        "current_location": truck.current_location,
        "latitude": truck.latitude,
        "longitude": truck.longitude,
        "availability_status": truck.availability_status,
        "preferred_routes": truck.preferred_routes,
        "last_updated": truck.last_updated,
        "driver": {
            "name": driver_user.full_name if driver_user else None,
            "phone": driver_user.phone if driver_user else None,
            "license": driver.license_number if driver else None,
            "rating": driver.rating if driver else 0,
            "total_trips": driver.total_trips if driver else 0,
        } if driver else None,
    }
