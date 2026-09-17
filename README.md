# 🚚 TRUCK TAXI — AI-Powered Truck Booking & Return-Load Matching Platform

> Find the Right Truck. Track the Journey. Move Smarter.

TRUCK TAXI is a full-stack logistics marketplace that connects **customers** who need goods transported with **drivers/truck owners** who have capacity available. It uses a weighted compatibility-scoring engine to recommend the best truck for a job, supports live-ish location tracking, in-app notifications, and a dedicated **return-load** feature that helps drivers find a paying job for the trip back instead of returning empty.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Vite), React Router v7, Axios, Leaflet / React-Leaflet (maps) |
| Backend | FastAPI (Python), SQLAlchemy ORM, Pydantic v2 |
| Database | SQLite by default (`trucktaxi.db`), swappable to PostgreSQL via `DATABASE_URL` |
| Auth | JWT (python-jose) + bcrypt password hashing, optional Google OAuth2 login |
| Matching "AI" | Custom deterministic weighted-scoring algorithm (not an ML model) |

---

## 2. Core Features

### Customer
- Register / log in (email+password or Google)
- Post a shipment request (pickup, destination, goods type, weight, date/time)
- **Find Truck** — get a ranked list of compatible trucks with an explainable match score
- Book a truck, track its status, view booking history
- Live truck location on a Leaflet map
- Rate drivers after a completed trip

### Driver
- Register with truck details (vehicle type, capacity, goods type, preferred routes)
- Accept / reject booking requests
- Update trip status (loading → in transit → delivered → completed)
- Manually push GPS coordinates for tracking
- **Return Loads** — after a delivery, see nearby open customer requests so the truck doesn't drive back empty
- View trip history and ratings received

### Admin
- Dashboard with platform-wide stats
- Manage users, drivers, trucks
- Oversee all bookings and trips

### Notifications
- Persisted, per-user notification records for booking requests, confirmations, cancellations, trip events, etc.

---

## 3. The Matching Engine ("AI")

Labelled as "AI-powered" in the project, but it is implemented as a **transparent, deterministic rules engine** rather than a trained ML model — a reasonable and honest design choice for a project like this, since it's explainable and doesn't need training data. `matching_engine.py` scores every eligible truck against a request out of 100 points:

| Factor | Max Points |
|---|---|
| Route compatibility | 30 |
| Capacity fit | 20 |
| Vehicle type match | 15 |
| Goods type match | 10 |
| Availability | 10 |
| Distance (haversine, from a hard-coded city coordinate table) | 10 |
| Timing | 5 |

`ai_service.py` then turns those sub-scores into a human-readable explanation ("Truck TN-01-AB-1234 is highly recommended... its route includes both Chennai and Bangalore..."). This is a nice touch for user trust, but it's template text, not an LLM call.

---

## 4. Project Structure

```
Truck-Taxi-ref-main/
├── backend/
│   ├── app/
│   │   ├── database/        # SQLAlchemy engine/session setup
│   │   ├── models/          # ORM models (User, Truck, Booking, Trip, Rating, ...)
│   │   ├── routers/         # auth, customer, driver, bookings, tracking, notifications, admin, trucks
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # matching_engine.py, ai_service.py, notification_service.py
│   │   ├── utils/           # JWT auth, role-based dependency guards
│   │   └── main.py          # FastAPI app, CORS, router registration
│   ├── seed.py               # Demo data generator
│   └── trucktaxi.db          # SQLite DB (dev)
└── frontend/
    ├── src/
    │   ├── context/AuthContext.jsx
    │   ├── layouts/          # DashboardLayout, Sidebar
    │   ├── pages/
    │   │   ├── admin/  customer/  driver/  auth/  public/
    │   │   └── Notifications.jsx
    │   ├── services/api.js   # Axios instance
    │   └── App.jsx           # Routes + role-based route guards
    └── package.json
```

---

## 5. Setup & Running Locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install fastapi uvicorn "sqlalchemy" "python-jose[cryptography]" \
            bcrypt python-dotenv httpx "pydantic[email]"

# create backend/.env — see Environment Variables below
uvicorn app.main:app --reload --port 8000
```

> ⚠️ There is no `requirements.txt` / `pyproject.toml` in the repo, so dependencies above are inferred from the imports. Add one before sharing this project — see Recommendations.

Optional demo data:
```bash
python seed.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### Environment Variables

Copy `.env.example` at the repo root and create real `.env` files:

**backend/.env**
```
DATABASE_URL=sqlite:///./trucktaxi.db
SECRET_KEY=<generate-a-long-random-string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_CLIENT_ID=            # optional
GOOGLE_CLIENT_SECRET=        # optional
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
APP_ENV=development
```

**frontend/.env**
```
VITE_API_URL=http://localhost:8000
```

---

## 6. API Overview

| Prefix | Router | Purpose |
|---|---|---|
| `/api/auth` | auth.py | Register (customer/driver), login, Google OAuth, `/me` |
| `/api/customer` | customer.py | Requests, find-truck, bookings history |
| `/api/driver` | driver.py | Truck profile, incoming requests, trip lifecycle |
| `/api/bookings` | bookings.py | Create/view/update bookings |
| `/api/tracking` | tracking.py | Truck locations, location history, GPS push |
| `/api/notifications` | notifications.py | List/mark-read notifications |
| `/api/admin` | admin.py | Platform-wide management |
| `/api/trucks` | trucks.py | Truck listing/lookup |

Interactive docs available at `http://localhost:8000/docs` once the backend is running (FastAPI auto-generates Swagger UI).

---

## 7. Known Limitations

- **No automated tests** — no unit, integration, or e2e test suite found.
- **No backend dependency manifest** — `requirements.txt`/`pyproject.toml` is missing.
- **Secrets and DB committed** — `backend/.env`, `frontend/.env`, and `trucktaxi.db` are not excluded by `.gitignore`, so real secrets (JWT `SECRET_KEY`, Google OAuth credentials) and live data risk being pushed to source control.
- **"Tracking" is poll-based, not real-time** — location updates rely on the driver manually POSTing coordinates and the frontend re-fetching; there's no WebSocket/SSE channel for live push updates.
- **Distance scoring uses a hard-coded city table** (~19 Indian cities) rather than a geocoding API, so it only works for those exact city names.
- **No payments** — booking/pricing logic exists, but there's no payment gateway integration.
- **Google OAuth flow exchanges tokens client → server → Google directly**; in production this should be validated more defensively (e.g., verifying the ID token signature rather than trusting the `/userinfo` response alone).

---

## 8. Evaluation Summary

**Score: 27 / 35**

| Category | Weight | Score | Notes |
|---|---|---|---|
| Feature completeness | 10 | 8.5 | Three full role-based portals, booking lifecycle, return-load matching, ratings, notifications — genuinely broad scope for a project. |
| Backend architecture & code quality | 8 | 6.5 | Clean separation of routers/services/schemas/models, consistent patterns, proper dependency-injected DB sessions, role-guarded endpoints. Docstrings are honest about the matching engine being deterministic, which is a plus. |
| Database design | 5 | 4.5 | Well-normalized schema, sensible enums, foreign keys, relationships all wired correctly with `back_populates`. |
| Security | 5 | 2.5 | Bcrypt + JWT is solid, and role dependencies are used everywhere. But default `SECRET_KEY` fallback in code, and `.env`/`.db` files not gitignored, are real red flags for a project meant to be shared or graded from its repo. |
| Frontend/UX | 4 | 3 | Clean React structure, protected routes with role redirects, map integration via Leaflet. Some inline styling (`style={{...}}`) instead of consistent CSS/theme usage in places like `Profile`. |
| Documentation & setup reproducibility | 3 | 2 | Original repo had no root README and no backend dependency file, making it hard for someone else to run cold. (This is now fixed by the README above.) |

**Bottom line:** this is a strong, well-organized full-stack project — the data model and matching logic in particular show real engineering thought, not just CRUD scaffolding. It loses points mainly on packaging/reproducibility (missing `requirements.txt`, no tests, secrets not gitignored) rather than on the core logic, which is solid. Fixing the items in Section 7 would easily push this into the low 30s.
