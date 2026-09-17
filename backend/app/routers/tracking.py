from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.db import get_db
from app.models.models import Truck, TruckLocation, TruckStatus, Driver, User
from app.schemas.schemas import TruckResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/tracking", tags=["tracking"])

# Demo truck locations for demonstration (labeled clearly)
DEMO_LOCATIONS = {
    "TN-01-AB-1234": {"lat": 12.9716, "lon": 77.5946, "location": "Bangalore"},
    "TN-02-CD-5678": {"lat": 12.9250, "lon": 77.5938, "location": "Bangalore South"},
    "TN-03-EF-9012": {"lat": 12.7409, "lon": 77.8253, "location": "Hosur"},
}


@router.get("/trucks")
def get_all_trucks_tracking(db: Session = Depends(get_db)):
    """Get tracking info for all trucks - uses stored coordinates."""
    trucks = db.query(Truck).filter(
        Truck.availability_status != TruckStatus.OFFLINE
    ).all()

    result = []
    for t in trucks:
        driver = t.driver
        driver_user = driver.user if driver else None

        lat = t.latitude
        lon = t.longitude

        # Use demo data if no real coordinates (clearly labeled)
        is_demo = False
        if not lat or not lon:
            demo = DEMO_LOCATIONS.get(t.truck_number)
            if demo:
                lat = demo["lat"]
                lon = demo["lon"]
                is_demo = True
            else:
                continue  # Skip trucks with no location data

        result.append({
            "id": t.id,
            "truck_number": t.truck_number,
            "vehicle_type": t.vehicle_type,
            "capacity": t.capacity,
            "current_location": t.current_location or (DEMO_LOCATIONS.get(t.truck_number, {}).get("location") if is_demo else None),
            "latitude": lat,
            "longitude": lon,
            "availability_status": t.availability_status,
            "driver_name": driver_user.full_name if driver_user else "Unknown",
            "driver_phone": driver_user.phone if driver_user else None,
            "last_updated": t.last_updated,
            "is_demo_location": is_demo,
        })

    return {"trucks": result, "total": len(result)}


@router.get("/truck/{truck_id}")
def get_truck_tracking(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    driver = truck.driver
    driver_user = driver.user if driver else None

    lat = truck.latitude
    lon = truck.longitude
    is_demo = False

    if not lat or not lon:
        demo = DEMO_LOCATIONS.get(truck.truck_number)
        if demo:
            lat = demo["lat"]
            lon = demo["lon"]
            is_demo = True

    # Get location history
    locations = db.query(TruckLocation).filter(
        TruckLocation.truck_id == truck_id
    ).order_by(TruckLocation.recorded_at.desc()).limit(10).all()

    return {
        "id": truck.id,
        "truck_number": truck.truck_number,
        "vehicle_type": truck.vehicle_type,
        "capacity": truck.capacity,
        "current_location": truck.current_location,
        "latitude": lat,
        "longitude": lon,
        "availability_status": truck.availability_status,
        "driver_name": driver_user.full_name if driver_user else "Unknown",
        "last_updated": truck.last_updated,
        "is_demo_location": is_demo,
        "location_history": [
            {
                "location": l.location_name,
                "lat": l.latitude,
                "lon": l.longitude,
                "time": l.recorded_at,
            }
            for l in locations
        ],
    }


@router.post("/location")
def update_location(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Driver updates their truck's GPS location."""
    from app.models.models import Driver
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    truck = db.query(Truck).filter(Truck.driver_id == driver.id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    lat = data.get("latitude")
    lon = data.get("longitude")
    location_name = data.get("location_name")

    if not lat or not lon:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required")

    # Update truck's current location
    truck.latitude = lat
    truck.longitude = lon
    if location_name:
        truck.current_location = location_name
    truck.last_updated = datetime.now(timezone.utc)

    # Record in history
    history = TruckLocation(
        truck_id=truck.id,
        location_name=location_name,
        latitude=lat,
        longitude=lon,
    )
    db.add(history)
    db.commit()

    return {"message": "Location updated", "latitude": lat, "longitude": lon}
