"""
AI Truck Matching Engine
Weighted scoring model - 100 points total
"""
import math
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import Truck, CustomerRequest, TruckStatus


# City coordinates for distance calculation (demo data)
CITY_COORDINATES = {
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "chennai": (13.0827, 80.2707),
    "hyderabad": (17.3850, 78.4867),
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.6139, 77.2090),
    "pune": (18.5204, 73.8567),
    "coimbatore": (11.0168, 76.9558),
    "hosur": (12.7409, 77.8253),
    "mysore": (12.2958, 76.6394),
    "mysuru": (12.2958, 76.6394),
    "salem": (11.6643, 78.1460),
    "madurai": (9.9252, 78.1198),
    "trichy": (10.7905, 78.7047),
    "vellore": (12.9165, 79.1325),
    "kolkata": (22.5726, 88.3639),
    "ahmedabad": (23.0225, 72.5714),
    "surat": (21.1702, 72.8311),
    "kochi": (9.9312, 76.2673),
    "thiruvananthapuram": (8.5241, 76.9366),
}


def get_coords(location: str):
    """Get lat/lon for a city name."""
    if not location:
        return None
    key = location.strip().lower()
    return CITY_COORDINATES.get(key)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two coordinates."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def normalize_string(s: str) -> str:
    return s.strip().lower() if s else ""


def score_route_compatibility(truck: Truck, request: CustomerRequest) -> float:
    """
    Route compatibility (30 pts max).
    Check if truck's preferred routes include request pickup/destination.
    """
    if not truck.preferred_routes:
        return 10.0  # Neutral if no preference set

    routes_text = normalize_string(truck.preferred_routes)
    pickup = normalize_string(request.pickup_location)
    destination = normalize_string(request.destination)

    score = 0.0
    pickup_match = any(city in routes_text for city in [pickup] + pickup.split())
    dest_match = any(city in routes_text for city in [destination] + destination.split())

    if pickup_match and dest_match:
        score = 30.0
    elif pickup_match or dest_match:
        score = 18.0
    else:
        score = 5.0

    return score


def score_capacity(truck: Truck, request: CustomerRequest) -> float:
    """
    Capacity compatibility (20 pts max).
    Truck must have >= weight requested. Bonus for near-perfect fit.
    """
    required = request.weight or 0
    if request.required_capacity:
        required = max(required, request.required_capacity)

    if truck.capacity <= 0:
        return 0.0

    if truck.capacity < required:
        return 0.0  # Cannot take the load

    ratio = required / truck.capacity  # 0.0 - 1.0
    if ratio >= 0.7:
        return 20.0  # Efficient use
    elif ratio >= 0.5:
        return 16.0
    elif ratio >= 0.3:
        return 12.0
    else:
        return 8.0  # Truck much larger than needed


def score_vehicle_type(truck: Truck, request: CustomerRequest) -> float:
    """Vehicle type match (15 pts max)."""
    if not request.vehicle_type:
        return 10.0  # No preference = neutral

    req_type = normalize_string(request.vehicle_type)
    truck_type = normalize_string(truck.vehicle_type)

    if req_type == truck_type:
        return 15.0

    # Partial matches
    vehicle_groups = {
        "container": ["container truck", "container", "heavy truck"],
        "lorry": ["lorry", "medium truck"],
        "mini": ["mini truck", "mini", "small truck", "pickup"],
        "tanker": ["tanker", "tank truck"],
        "flatbed": ["flatbed", "flat bed"],
        "refrigerated": ["refrigerated", "reefer", "cold storage"],
    }

    req_group = None
    truck_group = None
    for group, variants in vehicle_groups.items():
        if any(v in req_type for v in variants) or req_type == group:
            req_group = group
        if any(v in truck_type for v in variants) or truck_type == group:
            truck_group = group

    if req_group and req_group == truck_group:
        return 12.0

    return 3.0


def score_goods_type(truck: Truck, request: CustomerRequest) -> float:
    """Goods type compatibility (10 pts max)."""
    if not truck.goods_type:
        return 5.0

    truck_goods = normalize_string(truck.goods_type)
    req_goods = normalize_string(request.goods_type)

    if "general" in truck_goods or "all" in truck_goods or "any" in truck_goods:
        return 10.0  # General goods truck accepts everything

    if req_goods in truck_goods or truck_goods in req_goods:
        return 10.0

    # Category matching
    goods_categories = {
        "furniture": ["furniture", "household", "home goods"],
        "food": ["food", "perishable", "grocery", "agricultural"],
        "electronics": ["electronics", "electrical", "appliances"],
        "construction": ["construction", "building", "cement", "sand", "gravel"],
        "chemicals": ["chemicals", "hazmat", "industrial"],
    }

    req_cat = None
    truck_cat = None
    for cat, items in goods_categories.items():
        if any(item in req_goods for item in items):
            req_cat = cat
        if any(item in truck_goods for item in items):
            truck_cat = cat

    if req_cat and req_cat == truck_cat:
        return 8.0

    return 3.0


def score_availability(truck: Truck) -> float:
    """Availability score (10 pts max)."""
    if truck.availability_status == TruckStatus.AVAILABLE:
        return 10.0
    elif truck.availability_status == TruckStatus.DELIVERED:
        return 7.0  # About to become available
    elif truck.availability_status == TruckStatus.UNAVAILABLE:
        return 0.0
    elif truck.availability_status == TruckStatus.OFFLINE:
        return 0.0
    else:
        return 2.0


def score_distance(truck: Truck, request: CustomerRequest) -> float:
    """
    Distance score (10 pts max).
    How far the truck's current location is from the pickup point.
    """
    pickup_coords = get_coords(request.pickup_location)

    # Use truck's stored coordinates
    if truck.latitude and truck.longitude and pickup_coords:
        dist = haversine_distance(truck.latitude, truck.longitude, pickup_coords[0], pickup_coords[1])
    elif truck.current_location and pickup_coords:
        truck_coords = get_coords(truck.current_location)
        if truck_coords:
            dist = haversine_distance(truck_coords[0], truck_coords[1], pickup_coords[0], pickup_coords[1])
        else:
            return 5.0  # Unknown distance - neutral
    else:
        return 5.0  # Unknown distance - neutral

    # Score based on distance
    if dist <= 10:
        return 10.0
    elif dist <= 50:
        return 8.0
    elif dist <= 150:
        return 6.0
    elif dist <= 300:
        return 4.0
    elif dist <= 500:
        return 2.0
    else:
        return 1.0


def score_timing(truck: Truck, request: CustomerRequest) -> float:
    """Timing compatibility (5 pts max)."""
    # Basic timing scoring - if truck is available now and date is set
    if not request.pickup_date:
        return 3.0  # No date preference

    if truck.availability_status == TruckStatus.AVAILABLE:
        return 5.0
    elif truck.availability_status == TruckStatus.DELIVERED:
        return 3.0  # May be available soon
    else:
        return 1.0


def calculate_compatibility(truck: Truck, request: CustomerRequest) -> dict:
    """
    Calculate full compatibility score between a truck and a customer request.
    Returns individual scores and total score out of 100.
    """
    route_score = score_route_compatibility(truck, request)
    capacity_score = score_capacity(truck, request)
    vehicle_score = score_vehicle_type(truck, request)
    goods_score = score_goods_type(truck, request)
    availability_score = score_availability(truck)
    distance_score = score_distance(truck, request)
    timing_score = score_timing(truck, request)

    total = route_score + capacity_score + vehicle_score + goods_score + availability_score + distance_score + timing_score

    return {
        "route_score": round(route_score, 1),
        "capacity_score": round(capacity_score, 1),
        "vehicle_score": round(vehicle_score, 1),
        "goods_score": round(goods_score, 1),
        "availability_score": round(availability_score, 1),
        "distance_score": round(distance_score, 1),
        "timing_score": round(timing_score, 1),
        "total_score": round(total, 1),
    }


def match_trucks(request: CustomerRequest, db: Session) -> List[dict]:
    """
    Find and rank suitable trucks for a customer request.
    Only considers AVAILABLE or DELIVERED trucks with sufficient capacity.
    """
    # Get all trucks that are potentially available
    trucks = db.query(Truck).filter(
        Truck.availability_status.in_([TruckStatus.AVAILABLE, TruckStatus.DELIVERED])
    ).all()

    results = []

    for truck in trucks:
        # Check basic capacity requirement first
        required = request.weight or 0
        if request.required_capacity:
            required = max(required, request.required_capacity)

        if truck.capacity < required:
            continue  # Skip under-capacity trucks

        scores = calculate_compatibility(truck, request)

        # Only include trucks with a minimum meaningful score
        if scores["total_score"] < 15:
            continue

        driver = truck.driver
        driver_user = driver.user if driver else None

        results.append({
            "truck_id": truck.id,
            "truck_number": truck.truck_number,
            "driver_name": driver_user.full_name if driver_user else "Unknown",
            "driver_phone": driver_user.phone if driver_user else None,
            "vehicle_type": truck.vehicle_type,
            "capacity": truck.capacity,
            "goods_type": truck.goods_type,
            "current_location": truck.current_location,
            "preferred_routes": truck.preferred_routes,
            "availability_status": truck.availability_status,
            "latitude": truck.latitude,
            "longitude": truck.longitude,
            **scores,
        })

    # Sort by total score descending
    results.sort(key=lambda x: x["total_score"], reverse=True)
    return results


def find_return_loads(truck: Truck, db: Session) -> List[dict]:
    """
    Find return-load opportunities after a truck completes delivery.
    Looks for open customer requests near the truck's current location.
    """
    from app.models.models import CustomerRequest, Customer, RequestStatus

    open_requests = db.query(CustomerRequest).filter(
        CustomerRequest.status == RequestStatus.OPEN
    ).all()

    results = []

    for req in open_requests:
        scores = calculate_compatibility(truck, req)
        if scores["total_score"] >= 20:
            customer = req.customer
            customer_user = customer.user if customer else None
            results.append({
                "request_id": req.id,
                "customer_name": customer_user.full_name if customer_user else "Unknown",
                "pickup_location": req.pickup_location,
                "destination": req.destination,
                "goods_type": req.goods_type,
                "weight": req.weight,
                "pickup_date": req.pickup_date,
                "pickup_time": req.pickup_time,
                **scores,
            })

    results.sort(key=lambda x: x["total_score"], reverse=True)
    return results[:5]  # Top 5 return load opportunities
