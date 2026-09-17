from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.database.db import engine, Base
from app.models import models  # noqa: F401 - ensures models are registered
from app.routers import auth, customer, driver, bookings, tracking, notifications, admin, trucks

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TRUCK TAXI API",
    description="AI-Powered Truck Booking and Return-Load Matching Platform",
    version="1.0.0",
)

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(customer.router)
app.include_router(driver.router)
app.include_router(bookings.router)
app.include_router(tracking.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(trucks.router)


@app.get("/")
def root():
    return {
        "name": "TRUCK TAXI API",
        "version": "1.0.0",
        "status": "running",
        "tagline": "Find the Right Truck. Track the Journey. Move Smarter.",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
