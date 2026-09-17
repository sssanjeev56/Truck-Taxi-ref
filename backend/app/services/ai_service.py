"""
AI Explanation Service
Generates human-readable explanations for matching results.
Deterministic - based entirely on actual match data.
"""
from typing import Optional


def generate_match_explanation(
    truck_number: str,
    driver_name: str,
    scores: dict,
    truck_location: Optional[str],
    request_pickup: str,
    request_destination: str,
    capacity: float,
    required_weight: float,
    goods_type: str,
    preferred_routes: Optional[str],
) -> str:
    """
    Generate a plain-English explanation of why this truck was recommended.
    All logic is deterministic based on actual score data.
    """
    total = scores.get("total_score", 0)
    parts = []

    # Route explanation
    route_score = scores.get("route_score", 0)
    if route_score >= 25:
        parts.append(
            f"This truck's preferred route includes both {request_pickup} and {request_destination}, making it an excellent route match."
        )
    elif route_score >= 15:
        if preferred_routes:
            parts.append(f"The truck operates on routes that partially overlap with your journey (preferred: {preferred_routes}).")
        else:
            parts.append("The truck's route partially matches your pickup or destination.")
    else:
        parts.append("The truck's preferred route does not directly match your journey, but it may still be available.")

    # Capacity explanation
    cap_score = scores.get("capacity_score", 0)
    if cap_score >= 18:
        parts.append(
            f"The truck's {capacity}-ton capacity is well-suited for your {required_weight}-ton load, making efficient use of available space."
        )
    elif cap_score >= 10:
        parts.append(f"The truck's {capacity}-ton capacity can handle your {required_weight}-ton load.")
    elif cap_score > 0:
        parts.append(f"The truck has {capacity} tons of capacity, which covers your {required_weight}-ton requirement.")
    else:
        parts.append(f"Note: This truck's capacity ({capacity} tons) may not be sufficient for {required_weight} tons.")

    # Location/distance explanation
    dist_score = scores.get("distance_score", 0)
    if dist_score >= 8:
        parts.append(
            f"The truck is currently located very close to your pickup point ({truck_location or 'nearby'}), minimizing wait time."
        )
    elif dist_score >= 5:
        parts.append(f"The truck is at a moderate distance from your pickup location ({truck_location or 'unknown'}).")
    else:
        parts.append(f"The truck is currently located at {truck_location or 'an unknown location'}, which is further from your pickup point.")

    # Goods type explanation
    goods_score = scores.get("goods_score", 0)
    if goods_score >= 8:
        parts.append(f"The truck is equipped to handle {goods_type} goods.")
    elif goods_score >= 5:
        parts.append(f"The truck can generally handle goods similar to {goods_type}.")

    # Overall summary
    if total >= 80:
        summary = f"Truck {truck_number} (Driver: {driver_name}) is highly recommended with a compatibility score of {total}/100."
    elif total >= 60:
        summary = f"Truck {truck_number} (Driver: {driver_name}) is a good match with a compatibility score of {total}/100."
    elif total >= 40:
        summary = f"Truck {truck_number} (Driver: {driver_name}) is a reasonable option with a compatibility score of {total}/100."
    else:
        summary = f"Truck {truck_number} (Driver: {driver_name}) has a compatibility score of {total}/100. There may be better options available."

    explanation = summary + " " + " ".join(parts)
    return explanation


def generate_availability_insight(
    total_trucks: int,
    available_trucks: int,
    near_pickup_trucks: int,
    compatible_routes: int,
    sufficient_capacity: int,
) -> dict:
    """
    Generate smart availability insights based on real database data.
    """
    insights = {}

    if total_trucks == 0:
        insights["summary"] = "No trucks are registered in the system yet."
        insights["details"] = []
        return insights

    insights["summary"] = f"{available_trucks} truck{'s are' if available_trucks != 1 else ' is'} currently available out of {total_trucks} registered trucks."

    details = []
    if available_trucks > 0:
        details.append(f"{available_trucks} truck{'s' if available_trucks != 1 else ''} available right now")
    if near_pickup_trucks > 0:
        details.append(f"{near_pickup_trucks} truck{'s' if near_pickup_trucks != 1 else ''} near your pickup area")
    if compatible_routes > 0:
        details.append(f"{compatible_routes} truck{'s' if compatible_routes != 1 else ''} with compatible routes")
    if sufficient_capacity > 0:
        details.append(f"{sufficient_capacity} truck{'s' if sufficient_capacity != 1 else ''} with sufficient capacity")

    if not details:
        details.append("No matching trucks found for your specific requirements")

    insights["details"] = details
    return insights
