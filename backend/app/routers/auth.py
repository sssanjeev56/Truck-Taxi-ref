import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.models import User, Customer, Driver, Truck, LoginHistory, UserRole
from app.schemas.schemas import UserCreate, DriverRegister, LoginRequest, Token, UserResponse
from app.utils.auth import verify_password, get_password_hash, create_access_token
from app.utils.dependencies import get_current_user
import httpx

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")


def _record_login(db: Session, user: User, method: str = "email"):
    """Update login stats and record history."""
    user.login_count = (user.login_count or 0) + 1
    user.last_login_at = datetime.now(timezone.utc)
    history = LoginHistory(user_id=user.id, login_method=method)
    db.add(history)


@router.post("/register", response_model=Token, status_code=201)
def register_customer(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check existing
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    db.flush()

    # Create customer profile
    customer = Customer(user_id=user.id)
    db.add(customer)

    _record_login(db, user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/register/driver", response_model=Token, status_code=201)
def register_driver(data: DriverRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check truck number uniqueness
    existing_truck = db.query(Truck).filter(Truck.truck_number == data.truck_number).first()
    if existing_truck:
        raise HTTPException(status_code=400, detail="Truck number already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password_hash=get_password_hash(data.password),
        role=UserRole.DRIVER,
    )
    db.add(user)
    db.flush()

    driver = Driver(user_id=user.id, license_number=data.license_number)
    db.add(driver)
    db.flush()

    truck = Truck(
        driver_id=driver.id,
        truck_number=data.truck_number,
        vehicle_type=data.vehicle_type,
        capacity=data.capacity,
        goods_type=data.goods_type,
        current_location=data.current_location,
        latitude=data.latitude,
        longitude=data.longitude,
        preferred_routes=data.preferred_routes,
    )
    db.add(truck)

    _record_login(db, user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    is_first = not user.first_login_completed
    _record_login(db, user, "email")

    if is_first:
        user.first_login_completed = True

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.get("/google/url")
def google_auth_url():
    """Return Google OAuth URL - returns empty if not configured."""
    if not GOOGLE_CLIENT_ID:
        return {"url": None, "configured": False}

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{query}"
    return {"url": url, "configured": True}


@router.post("/google/callback", response_model=Token)
async def google_callback(data: dict, db: Session = Depends(get_db)):
    """Handle Google OAuth callback with authorization code."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured on this server")

    code = data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is required")

    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google token")

        token_data = token_res.json()
        access_token = token_data.get("access_token")

        # Get user info
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")

        google_user = user_res.json()

    email = google_user.get("email")
    name = google_user.get("name", email)
    google_id = google_user.get("id")

    if not email:
        raise HTTPException(status_code=400, detail="Could not get email from Google")

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    is_first = False

    if not user:
        user = User(
            full_name=name,
            email=email,
            google_id=google_id,
            role=UserRole.CUSTOMER,
        )
        db.add(user)
        db.flush()
        customer = Customer(user_id=user.id)
        db.add(customer)
        is_first = True
    else:
        if not user.google_id:
            user.google_id = google_id
        is_first = not user.first_login_completed

    _record_login(db, user, "google")
    if is_first:
        user.first_login_completed = True

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
