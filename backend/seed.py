"""
Demo Data Seeder for TRUCK TAXI
Run: python seed.py
Creates realistic demo users, drivers, trucks, customers, requests, bookings and trips.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.database.db import SessionLocal, engine, Base
from app.models.models import (
    User, Customer, Driver, Truck, CustomerRequest, Booking, Trip,
    TruckLocation, Notification, MatchingResult,
    UserRole, TruckStatus, BookingStatus, TripStatus, RequestStatus, NotificationType
)
from app.utils.auth import get_password_hash
from datetime import datetime, timezone, timedelta

Base.metadata.create_all(bind=engine)

db = SessionLocal()

def clear_data():
    print("Clearing existing data...")
    db.query(MatchingResult).delete()
    db.query(Notification).delete()
    db.query(TruckLocation).delete()
    db.query(Trip).delete()
    db.query(Booking).delete()
    db.query(CustomerRequest).delete()
    db.query(Truck).delete()
    db.query(Driver).delete()
    db.query(Customer).delete()
    db.query(User).delete()
    db.commit()

def seed():
    clear_data()
    print("Seeding demo data...")

    # ---- ADMIN ----
    admin_user = User(
        full_name="Admin User",
        email="admin@trucktaxi.in",
        phone="9000000000",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        first_login_completed=True,
        login_count=10,
    )
    db.add(admin_user)
    db.flush()

    # ---- CUSTOMERS ----
    c1_user = User(
        full_name="Ramesh Kumar",
        email="ramesh@example.com",
        phone="9876543210",
        password_hash=get_password_hash("customer123"),
        role=UserRole.CUSTOMER,
        first_login_completed=True,
        login_count=3,
    )
    db.add(c1_user)
    db.flush()
    customer1 = Customer(user_id=c1_user.id)
    db.add(customer1)

    c2_user = User(
        full_name="Priya Sharma",
        email="priya@example.com",
        phone="9876543211",
        password_hash=get_password_hash("customer123"),
        role=UserRole.CUSTOMER,
        first_login_completed=False,
        login_count=0,
    )
    db.add(c2_user)
    db.flush()
    customer2 = Customer(user_id=c2_user.id)
    db.add(customer2)

    db.flush()

    # ---- DRIVERS ----
    d1_user = User(
        full_name="Suresh Raj",
        email="suresh@trucktaxi.in",
        phone="9123456789",
        password_hash=get_password_hash("driver123"),
        role=UserRole.DRIVER,
        first_login_completed=True,
        login_count=15,
    )
    db.add(d1_user)
    db.flush()
    driver1 = Driver(user_id=d1_user.id, license_number="TN-DL-2019-123456", rating=4.8, total_trips=47)
    db.add(driver1)
    db.flush()
    truck1 = Truck(
        driver_id=driver1.id,
        truck_number="TN-01-AB-1234",
        vehicle_type="Container Truck",
        capacity=10.0,
        goods_type="General Goods",
        current_location="Bangalore",
        latitude=12.9716,
        longitude=77.5946,
        availability_status=TruckStatus.AVAILABLE,
        preferred_routes="Bangalore → Chennai, Bangalore → Hyderabad",
    )
    db.add(truck1)

    d2_user = User(
        full_name="Muthu Vel",
        email="muthu@trucktaxi.in",
        phone="9234567890",
        password_hash=get_password_hash("driver123"),
        role=UserRole.DRIVER,
        first_login_completed=True,
        login_count=8,
    )
    db.add(d2_user)
    db.flush()
    driver2 = Driver(user_id=d2_user.id, license_number="TN-DL-2021-789012", rating=4.5, total_trips=23)
    db.add(driver2)
    db.flush()
    truck2 = Truck(
        driver_id=driver2.id,
        truck_number="TN-02-CD-5678",
        vehicle_type="Lorry",
        capacity=7.0,
        goods_type="Furniture",
        current_location="Bangalore",
        latitude=12.9250,
        longitude=77.5938,
        availability_status=TruckStatus.AVAILABLE,
        preferred_routes="Bangalore → Chennai, Bangalore → Coimbatore",
    )
    db.add(truck2)

    d3_user = User(
        full_name="Karthik Babu",
        email="karthik@trucktaxi.in",
        phone="9345678901",
        password_hash=get_password_hash("driver123"),
        role=UserRole.DRIVER,
        first_login_completed=True,
        login_count=5,
    )
    db.add(d3_user)
    db.flush()
    driver3 = Driver(user_id=d3_user.id, license_number="TN-DL-2020-345678", rating=4.2, total_trips=12)
    db.add(driver3)
    db.flush()
    truck3 = Truck(
        driver_id=driver3.id,
        truck_number="TN-03-EF-9012",
        vehicle_type="Mini Truck",
        capacity=4.0,
        goods_type="General Goods",
        current_location="Hosur",
        latitude=12.7409,
        longitude=77.8253,
        availability_status=TruckStatus.AVAILABLE,
        preferred_routes="Hosur → Chennai, Hosur → Bangalore",
    )
    db.add(truck3)

    d4_user = User(
        full_name="Arjun Nair",
        email="arjun@trucktaxi.in",
        phone="9456789012",
        password_hash=get_password_hash("driver123"),
        role=UserRole.DRIVER,
        first_login_completed=True,
        login_count=20,
    )
    db.add(d4_user)
    db.flush()
    driver4 = Driver(user_id=d4_user.id, license_number="KL-DL-2018-654321", rating=4.9, total_trips=89)
    db.add(driver4)
    db.flush()
    truck4 = Truck(
        driver_id=driver4.id,
        truck_number="KA-04-GH-3456",
        vehicle_type="Container Truck",
        capacity=15.0,
        goods_type="Electronics",
        current_location="Chennai",
        latitude=13.0827,
        longitude=80.2707,
        availability_status=TruckStatus.AVAILABLE,
        preferred_routes="Chennai → Bangalore, Chennai → Hyderabad",
    )
    db.add(truck4)

    d5_user = User(
        full_name="Venkat Reddy",
        email="venkat@trucktaxi.in",
        phone="9567890123",
        password_hash=get_password_hash("driver123"),
        role=UserRole.DRIVER,
        first_login_completed=True,
        login_count=11,
    )
    db.add(d5_user)
    db.flush()
    driver5 = Driver(user_id=d5_user.id, license_number="AP-DL-2017-987654", rating=4.6, total_trips=56)
    db.add(driver5)
    db.flush()
    truck5 = Truck(
        driver_id=driver5.id,
        truck_number="AP-05-IJ-7890",
        vehicle_type="Lorry",
        capacity=8.0,
        goods_type="Agricultural Produce",
        current_location="Hyderabad",
        latitude=17.3850,
        longitude=78.4867,
        availability_status=TruckStatus.AVAILABLE,
        preferred_routes="Hyderabad → Bangalore, Hyderabad → Chennai",
    )
    db.add(truck5)

    db.flush()

    # ---- CUSTOMER REQUESTS ----
    req1 = CustomerRequest(
        customer_id=customer1.id,
        pickup_location="Bangalore",
        destination="Chennai",
        goods_type="Furniture",
        weight=6.0,
        vehicle_type="Container Truck",
        required_capacity=6.0,
        pickup_date="2026-09-20",
        pickup_time="09:00",
        status=RequestStatus.OPEN,
    )
    db.add(req1)

    req2 = CustomerRequest(
        customer_id=customer2.id,
        pickup_location="Bangalore",
        destination="Hyderabad",
        goods_type="Electronics",
        weight=3.0,
        vehicle_type="Mini Truck",
        required_capacity=3.0,
        pickup_date="2026-09-21",
        pickup_time="10:00",
        status=RequestStatus.OPEN,
    )
    db.add(req2)

    req3 = CustomerRequest(
        customer_id=customer1.id,
        pickup_location="Chennai",
        destination="Bangalore",
        goods_type="General Goods",
        weight=8.0,
        vehicle_type="Lorry",
        required_capacity=8.0,
        pickup_date="2026-09-22",
        pickup_time="08:00",
        status=RequestStatus.OPEN,
    )
    db.add(req3)

    db.flush()

    # ---- DEMO BOOKING (COMPLETED) ----
    past_booking = Booking(
        customer_id=customer1.id,
        truck_id=truck1.id,
        pickup_location="Mysore",
        destination="Bangalore",
        goods_type="General Goods",
        weight=5.0,
        pickup_date="2026-09-10",
        pickup_time="08:00",
        status=BookingStatus.COMPLETED,
        compatibility_score=88.0,
    )
    db.add(past_booking)
    db.flush()

    past_trip = Trip(
        booking_id=past_booking.id,
        driver_id=driver1.id,
        truck_id=truck1.id,
        status=TripStatus.COMPLETED,
        started_at=datetime.now(timezone.utc) - timedelta(days=7, hours=2),
        completed_at=datetime.now(timezone.utc) - timedelta(days=7),
    )
    db.add(past_trip)

    # ---- NOTIFICATIONS ----
    notifs = [
        Notification(
            user_id=c1_user.id,
            type=NotificationType.TRIP_COMPLETED,
            title="Trip Completed!",
            message="Your goods from Mysore to Bangalore were delivered successfully.",
            is_read=True,
        ),
        Notification(
            user_id=d1_user.id,
            type=NotificationType.GENERAL,
            title="Welcome to Truck Taxi",
            message="Your truck TN-01-AB-1234 is now listed and available for bookings.",
            is_read=True,
        ),
        Notification(
            user_id=c1_user.id,
            type=NotificationType.GENERAL,
            title="Welcome to Truck Taxi",
            message="Find the right truck for your journey. Use the Find Truck feature to get started.",
            is_read=False,
        ),
    ]
    for n in notifs:
        db.add(n)

    db.commit()
    print("\n✅ Demo data seeded successfully!")
    print("\n📋 DEMO LOGIN CREDENTIALS:")
    print("─" * 40)
    print("ADMIN:    admin@trucktaxi.in      / admin123")
    print("CUSTOMER: ramesh@example.com      / customer123")
    print("CUSTOMER: priya@example.com       / customer123 (first login)")
    print("DRIVER:   suresh@trucktaxi.in     / driver123")
    print("DRIVER:   muthu@trucktaxi.in      / driver123")
    print("DRIVER:   karthik@trucktaxi.in    / driver123")
    print("─" * 40)
    print("\n🚛 Demo Trucks Available:")
    print("  TN-01-AB-1234 | Container Truck | 10 tons | Bangalore")
    print("  TN-02-CD-5678 | Lorry           | 7 tons  | Bangalore")
    print("  TN-03-EF-9012 | Mini Truck      | 4 tons  | Hosur")
    print("  KA-04-GH-3456 | Container Truck | 15 tons | Chennai")
    print("  AP-05-IJ-7890 | Lorry           | 8 tons  | Hyderabad")


if __name__ == "__main__":
    seed()
    db.close()
