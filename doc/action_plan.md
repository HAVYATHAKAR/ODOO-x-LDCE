# GlobeTrotter End-to-End Master Implementation Plan

> **Document Status:** Final, Authoritative Blueprint
> **Purpose:** This document consolidates all product requirements, architectural decisions, database schemas, REST API contracts, UI/UX design tokens, and an exhaustive step-by-step execution plan into a single, comprehensive guide for end-to-end implementation.

---

## 1. Executive Summary & Product Vision

GlobeTrotter is a deterministic, rule-based **planning cockpit for multi-city travel**. It unifies discovery, scheduling, and budget tracking into a single persistent **Trip Workspace**. 
- **Core Loop:** `DISCOVER → PLAN → VALIDATE → OPTIMIZE → SHARE`
- **Key Differentiator:** Unlike generic AI planners, GlobeTrotter computes Trip Health (budget, pacing, logic) using deterministic algorithms in PostgreSQL/FastAPI. It does not rely on third-party mapping or booking APIs, operating entirely on seeded datasets.

### 1.1 Product Principles
1. **One trip, one workspace:** Discover, Itinerary, Calendar, Budget, Health, and Share are views of the same trip. State persists across all of them.
2. **Show your work:** No unexplained scores or recommendations.
3. **Estimates are not expenses:** Planning is provisional; spending is a fact. The UI never conflates them.
4. **Deterministic intelligence:** Trip Health and recommendations are rule-based (FastAPI + PostgreSQL). No black-box AI.
5. **Design with constraints:** Minimal external APIs; the product must work and feel fast on our own dataset.

---

## 2. Comprehensive Directory Structure

To ensure codebase scalability, we enforce a strict feature-sliced architecture.

### 2.1 Backend Structure (FastAPI)
```text
backend/
├── alembic.ini                # Alembic configuration
├── pyproject.toml             # Dependencies (Poetry)
├── .env                       # Environment variables (DATABASE_URL, JWT_SECRET)
└── app/
    ├── main.py                # FastAPI app initialization, CORS, global exception handlers
    ├── core/
    │   ├── config.py          # pydantic-settings config class
    │   ├── database.py        # SQLAlchemy engine, SessionLocal, get_db()
    │   └── security.py        # JWT encoding/decoding, passlib bcrypt hashing
    ├── models/                # SQLAlchemy ORM Models
    │   ├── __init__.py        # Exposes all models for Alembic autogenerate
    │   ├── user.py            # User and Auth models
    │   ├── trip.py            # Core Trip entity
    │   ├── section.py         # TripSection and SectionActivity
    │   ├── city.py            # Reference Data: Cities and Activities
    │   └── community.py       # Posts, Comments, Likes
    ├── schemas/               # Pydantic validation (DTOs)
    │   ├── auth.py            # Login/Register payloads
    │   ├── trip.py            # Trip creation and responses
    │   ├── section.py         # Section and Activity schemas
    │   ├── budget.py          # Budget breakdown responses
    │   └── common.py          # Pagination and generic responses
    ├── crud/                  # Pure data access (No HTTP logic)
    │   ├── crud_user.py
    │   ├── crud_trip.py
    │   └── crud_section.py
    ├── services/              # Business logic
    │   ├── budget_service.py  # Calculates Planned vs Actual variance
    │   ├── health_service.py  # 0-100 deterministic scoring logic
    │   └── share_service.py   # Deep clone trip logic
    ├── api/
    │   ├── deps.py            # Dependency injections (get_current_user)
    │   └── routers/
    │       ├── auth_router.py
    │       ├── trips_router.py
    │       ├── sections_router.py
    │       ├── public_router.py
    │       └── admin_router.py
    ├── seeds/
    │   ├── seed_data.py       # Script to populate cities and activities
    │   └── static_data.json   # Base data for seeding
    └── tests/                 # Pytest suite
        ├── conftest.py
        ├── test_auth.py
        ├── test_budget.py
        └── test_health.py
```

### 2.2 Frontend Structure (React + Vite)
```text
frontend/
├── package.json
├── tailwind.config.js         # Design system tokens configuration
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx               # ReactDOM render and provider wrapping
    ├── router.tsx             # React Router configuration
    ├── api/
    │   ├── client.ts          # Axios instance with JWT interceptors
    │   └── endpoints.ts       # Typed API wrapper functions
    ├── context/
    │   └── AuthContext.tsx    # Global session state
    ├── hooks/
    │   ├── queries/           # TanStack Query useQuery hooks
    │   │   ├── useTrip.ts
    │   │   ├── useCities.ts
    │   │   └── useBudget.ts
    │   └── mutations/         # TanStack Query useMutation hooks
    │       ├── useCreateTrip.ts
    │       └── useReorderSections.ts
    ├── styles/
    │   ├── index.css          # Tailwind imports
    │   └── tokens.css         # CSS Variables (Colors, spacing, typography)
    ├── components/            # Reusable UI primitives (Design System)
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   └── Button.test.tsx
    │   ├── Input/
    │   ├── Card/
    │   ├── Modal/
    │   └── Toast/
    ├── features/              # Feature-sliced domain components
    │   ├── ItineraryBuilder/
    │   │   ├── DayColumn.tsx
    │   │   ├── SortableItem.tsx
    │   │   └── DraggableContext.tsx
    │   ├── BudgetCharts/
    │   │   ├── VarianceBar.tsx
    │   │   └── CategoryDonut.tsx
    │   ├── TripHealth/
    │   │   ├── HealthGauge.tsx
    │   │   └── InsightRow.tsx
    │   └── Discover/
    │       ├── CityGrid.tsx
    │       └── ActivityFilter.tsx
    └── pages/                 # Route-level views
        ├── Landing.tsx
        ├── Auth/
        │   ├── Login.tsx
        │   └── Register.tsx
        ├── Dashboard.tsx
        ├── Discover.tsx
        └── Workspace/
            ├── WorkspaceLayout.tsx
            ├── OverviewTab.tsx
            ├── ItineraryTab.tsx
            ├── BudgetTab.tsx
            ├── HealthTab.tsx
            └── ShareTab.tsx
```

---

## 3. Database Schema & Exact Model Relationships

The system uses PostgreSQL 16. It is strictly normalized to 3NF. 
We rely on SQLAlchemy 2.0 ORM for definition.

### 3.1 SQLAlchemy Models (Complete Implementations)

#### `models/base.py`
```python
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
from sqlalchemy import Column, DateTime

Base = declarative_base()

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
```

#### `models/user.py`
```python
from sqlalchemy import Column, BigInteger, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
from sqlalchemy.dialects.postgresql import CITEXT

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(BigInteger, primary_key=True)
    username = Column(CITEXT, unique=True, nullable=False)
    email = Column(CITEXT, unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    phone_number = Column(String(20), nullable=True)
    city = Column(String(120), nullable=True)
    country = Column(String(120), nullable=True)
    additional_info = Column(String(1000), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    language_pref = Column(String(10), default="en", nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    trips = relationship("Trip", back_populates="owner", cascade="all, delete-orphan")
    posts = relationship("CommunityPost", back_populates="author")
    saved_destinations = relationship("SavedDestination", back_populates="user")
```

#### `models/city.py`
```python
from sqlalchemy import Column, BigInteger, String, Numeric, Integer, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class City(Base):
    __tablename__ = "cities"
    
    id = Column(BigInteger, primary_key=True)
    name = Column(String(120), nullable=False)
    country = Column(String(120), nullable=False)
    region = Column(String(120), nullable=True)
    latitude = Column(Numeric(9,6), nullable=True)
    longitude = Column(Numeric(9,6), nullable=True)
    cost_index = Column(Numeric(6,2), default=100, nullable=False)
    popularity_score = Column(Integer, default=0, nullable=False)
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    activities = relationship("Activity", back_populates="city")
    
    __table_args__ = (
        UniqueConstraint("name", "country", name="uq_city_country"),
    )

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(BigInteger, primary_key=True)
    city_id = Column(BigInteger, ForeignKey("cities.id"), nullable=False)
    name = Column(String(160), nullable=False)
    category = Column(String(40), nullable=False) # sightseeing, food, adventure, etc.
    description = Column(Text, nullable=True)
    estimated_cost = Column(Numeric(10,2), default=0, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    image_url = Column(String(500), nullable=True)
    
    city = relationship("City", back_populates="activities")
```

#### `models/trip.py`
```python
from sqlalchemy import Column, BigInteger, String, Boolean, Date, Numeric, Text, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class Trip(Base, TimestampMixin):
    __tablename__ = "trips"
    
    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    name = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    cover_photo_url = Column(String(500), nullable=True)
    total_budget = Column(Numeric(12,2), nullable=True)
    currency = Column(String(3), default='INR', nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    public_slug = Column(String(16), unique=True, nullable=True)
    copied_from_trip_id = Column(BigInteger, ForeignKey("trips.id"), nullable=True)
    
    owner = relationship("User", back_populates="trips")
    sections = relationship("TripSection", back_populates="trip", cascade="all, delete-orphan", order_by="TripSection.sequence_order")
    
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="check_trip_dates"),
        CheckConstraint("total_budget IS NULL OR total_budget >= 0", name="check_trip_budget"),
    )
```

#### `models/section.py`
```python
from sqlalchemy import Column, BigInteger, String, Integer, Date, Time, Numeric, Text, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class TripSection(Base):
    __tablename__ = "trip_sections"
    
    id = Column(BigInteger, primary_key=True)
    trip_id = Column(BigInteger, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)
    section_type = Column(String(20), nullable=False)
    city_id = Column(BigInteger, ForeignKey("cities.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    budget = Column(Numeric(12,2), default=0, nullable=False)
    sequence_order = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    
    trip = relationship("Trip", back_populates="sections")
    activities = relationship("SectionActivity", back_populates="section", cascade="all, delete-orphan", order_by="SectionActivity.sequence_order")
    
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="check_section_dates"),
        CheckConstraint("budget >= 0", name="check_section_budget"),
        UniqueConstraint("trip_id", "sequence_order", name="uq_trip_section_order", deferrable=True)
    )

class SectionActivity(Base):
    __tablename__ = "section_activities"
    
    id = Column(BigInteger, primary_key=True)
    trip_section_id = Column(BigInteger, ForeignKey("trip_sections.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(BigInteger, ForeignKey("activities.id"), nullable=True)
    custom_name = Column(String(160), nullable=True)
    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(Time, nullable=True)
    sequence_order = Column(Integer, nullable=False)
    expense = Column(Numeric(10,2), default=0, nullable=False)
    notes = Column(Text, nullable=True)
    
    section = relationship("TripSection", back_populates="activities")
    
    __table_args__ = (
        CheckConstraint("activity_id IS NOT NULL OR custom_name IS NOT NULL", name="check_activity_identity"),
        CheckConstraint("expense >= 0", name="check_activity_expense"),
    )
```

#### `models/community.py`
```python
from sqlalchemy import Column, BigInteger, String, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class CommunityPost(Base, TimestampMixin):
    __tablename__ = "community_posts"
    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trip_id = Column(BigInteger, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    like_count = Column(Integer, default=0, nullable=False)
    
    author = relationship("User", back_populates="posts")
    likes = relationship("CommunityLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("CommunityComment", back_populates="post", cascade="all, delete-orphan")

class CommunityLike(Base, TimestampMixin):
    __tablename__ = "community_likes"
    id = Column(BigInteger, primary_key=True)
    post_id = Column(BigInteger, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    post = relationship("CommunityPost", back_populates="likes")
    
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_like"),
    )

class CommunityComment(Base, TimestampMixin):
    __tablename__ = "community_comments"
    id = Column(BigInteger, primary_key=True)
    post_id = Column(BigInteger, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body = Column(Text, nullable=False)
    
    post = relationship("CommunityPost", back_populates="comments")
```

---

## 4. Backend Services Algorithms

### 4.1 Budget Service Algorithm (`services/budget_service.py`)
```python
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.trip import Trip
from app.models.section import TripSection, SectionActivity

def get_budget_breakdown(db: Session, trip_id: int):
    # 1. Fetch Trip Total Budget
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    target_budget = trip.total_budget
    
    # 2. Fetch Planned by Category
    planned_by_cat = db.query(
        TripSection.section_type,
        func.sum(TripSection.budget).label('planned_total')
    ).filter(TripSection.trip_id == trip_id).group_by(TripSection.section_type).all()
    
    # 3. Fetch Actual by Category
    actual_by_cat = db.query(
        TripSection.section_type,
        func.sum(SectionActivity.expense).label('actual_total')
    ).join(SectionActivity, TripSection.id == SectionActivity.trip_section_id)\
     .filter(TripSection.trip_id == trip_id)\
     .group_by(TripSection.section_type).all()
     
    # 4. Map into response dictionary
    breakdown = {}
    total_planned = 0
    total_actual = 0
    
    for section_type, planned in planned_by_cat:
        breakdown[section_type] = {"planned": float(planned), "actual": 0.0}
        total_planned += float(planned)
        
    for section_type, actual in actual_by_cat:
        if section_type in breakdown:
            breakdown[section_type]["actual"] = float(actual)
        else:
            breakdown[section_type] = {"planned": 0.0, "actual": float(actual)}
        total_actual += float(actual)
        
    return {
        "target_budget": float(target_budget) if target_budget else total_planned,
        "total_planned": total_planned,
        "total_actual": total_actual,
        "variance": total_planned - total_actual,
        "breakdown": breakdown
    }
```

### 4.2 Trip Health Engine Algorithm (`services/health_service.py`)
```python
def calculate_trip_health(db: Session, trip_id: int):
    score = 100
    insights = []
    
    budget_data = get_budget_breakdown(db, trip_id)
    
    # Rule 1: Budget
    if budget_data["total_actual"] > budget_data["target_budget"]:
        overage = budget_data["total_actual"] - budget_data["target_budget"]
        penalty = min(20, int((overage / budget_data["target_budget"]) * 100))
        score -= penalty
        insights.append({
            "category": "Budget",
            "message": f"You are over budget by {overage}.",
            "impact": -penalty,
            "severity": "warning"
        })
        
    # Rule 2: Schedule Balance (Activity Density per Day)
    days = db.query(
        SectionActivity.scheduled_date,
        func.count(SectionActivity.id).label("activity_count")
    ).join(TripSection, SectionActivity.trip_section_id == TripSection.id)\
     .filter(TripSection.trip_id == trip_id)\
     .group_by(SectionActivity.scheduled_date).all()
     
    for day, count in days:
        if count > 4:  # Hardcoded pace limit for MVP
            score -= 5
            insights.append({
                "category": "Schedule",
                "message": f"Day {day} is heavily loaded with {count} activities.",
                "impact": -5,
                "severity": "warning",
                "action": "move_it_for_me",
                "context_date": day
            })
            
    # Rule 3: Completeness
    if len(days) == 0:
        score -= 20
        insights.append({
            "category": "Completeness",
            "message": "Your trip has no scheduled activities.",
            "impact": -20,
            "severity": "danger"
        })
        
    return {
        "overall_score": max(0, score),
        "insights": insights
    }
```

---

## 5. REST API Specifications & JSON Schemas

### 5.1 Request Validation Schemas (Pydantic)
```python
# app/schemas/trip.py
from pydantic import BaseModel, Field, HttpUrl
from datetime import date
from typing import Optional

class TripCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=160)
    description: Optional[str] = None
    start_date: date
    end_date: date
    cover_photo_url: Optional[HttpUrl] = None
    total_budget: Optional[float] = Field(None, ge=0)
    currency: str = Field("INR", max_length=3)

class TripResponse(TripCreate):
    id: int
    user_id: int
    is_public: bool
    public_slug: Optional[str]
    
    class Config:
        orm_mode = True
```

### 5.2 API Routes List

| Method | Route | Description | Requires JWT |
|---|---|---|---|
| **POST** | `/api/v1/auth/register` | Register a new user and return JWT | No |
| **POST** | `/api/v1/auth/login` | Login and return JWT access and refresh tokens | No |
| **GET** | `/api/v1/trips` | Get paginated list of trips for current user | Yes |
| **POST** | `/api/v1/trips` | Create a trip | Yes |
| **GET** | `/api/v1/trips/{trip_id}` | Get detailed trip, including all nested sections and activities | Yes |
| **PUT** | `/api/v1/trips/{trip_id}` | Update trip headers (dates, name, budget) | Yes |
| **DELETE** | `/api/v1/trips/{trip_id}` | Delete trip (cascade deletes sections) | Yes |
| **POST** | `/api/v1/trips/{trip_id}/sections` | Add a new Section (leg, hotel) | Yes |
| **PUT** | `/api/v1/trips/{trip_id}/sections/reorder` | Accept array of IDs. Bulk updates `sequence_order` | Yes |
| **POST** | `/api/v1/sections/{sec_id}/activities` | Add an activity to a section | Yes |
| **PUT** | `/api/v1/activities/{act_id}` | Update scheduled time, date, expense, or order | Yes |
| **GET** | `/api/v1/trips/{trip_id}/budget` | Get computed budget JSON | Yes |
| **GET** | `/api/v1/trips/{trip_id}/health` | Get computed health score JSON | Yes |
| **POST** | `/api/v1/trips/{trip_id}/share` | Sets `is_public = True` and returns generated `public_slug` | Yes |
| **GET** | `/api/v1/public/trips/{slug}` | Fetch read-only trip data for sharing | No |
| **POST** | `/api/v1/public/trips/{slug}/copy` | Deep clones public trip into authenticated user account | Yes |
| **GET** | `/api/v1/cities` | Search cities (params: `q`, `limit`, `offset`) | Yes |
| **GET** | `/api/v1/activities` | Search activities (params: `city_id`, `category`) | Yes |

---

## 6. Seed Data & JSON Samples

To ensure the app does not feel empty during demo, we must pre-populate the DB using a JSON file (`backend/app/seeds/static_data.json`).

### 6.1 Sample City JSON
```json
{
  "cities": [
    {
      "name": "Tokyo",
      "country": "Japan",
      "region": "East Asia",
      "latitude": 35.6762,
      "longitude": 139.6503,
      "cost_index": 120,
      "popularity_score": 95,
      "description": "Bustling metropolis mixing ultramodern and traditional.",
      "image_url": "https://example.com/tokyo.jpg"
    },
    {
      "name": "Kyoto",
      "country": "Japan",
      "region": "East Asia",
      "latitude": 35.0116,
      "longitude": 135.7680,
      "cost_index": 110,
      "popularity_score": 88,
      "description": "Famous for classical Buddhist temples and gardens.",
      "image_url": "https://example.com/kyoto.jpg"
    }
  ]
}
```

### 6.2 Sample Activities JSON
```json
{
  "activities": [
    {
      "city_name": "Tokyo",
      "name": "Senso-ji Temple Tour",
      "category": "culture",
      "estimated_cost": 0.00,
      "duration_minutes": 120,
      "description": "Tokyo's oldest and most significant temple."
    },
    {
      "city_name": "Tokyo",
      "name": "Shibuya Crossing Photography",
      "category": "sightseeing",
      "estimated_cost": 0.00,
      "duration_minutes": 60,
      "description": "Experience the world's busiest pedestrian crossing."
    },
    {
      "city_name": "Kyoto",
      "name": "Fushimi Inari Shrine Hike",
      "category": "adventure",
      "estimated_cost": 0.00,
      "duration_minutes": 180,
      "description": "Hike through thousands of vibrant orange torii gates."
    }
  ]
}
```

---

## 7. UI/UX Design System & Tailwind Integration

### 7.1 Tailwind Configuration (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        surfaceElevated: "var(--surface-elevated)",
        foreground: "var(--foreground)",
        foregroundMuted: "var(--foreground-muted)",
        border: "var(--border)",
        brand: {
          DEFAULT: "var(--brand)",
          strong: "var(--brand-strong)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      }
    },
  },
  plugins: [],
}
```

### 7.2 CSS Variables (`src/styles/tokens.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: #FFFFFF;
    --surface: #F7F5F2;
    --surface-elevated: #FFFFFF;
    --foreground: #1A1D23;
    --foreground-muted: #5B6472;
    --border: #E4E1DB;
    
    --brand: #B5502E;
    --brand-strong: #8F3E22;
    --success: #1E7A4C;
    --warning: #B7791F;
    --danger: #C13333;
    --info: #2A6FB0;

    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-pill: 9999px;

    --shadow-sm: 0 1px 2px rgba(15,23,42,0.06);
    --shadow-md: 0 4px 12px rgba(15,23,42,0.08);
  }
  
  body {
    @apply bg-background text-foreground font-body;
  }
  
  h1, h2, h3 {
    @apply font-display tracking-tight;
  }
}
```

### 7.3 Frontend Component Props Contracts
```typescript
// src/components/TripCard/TripCard.tsx
export interface TripCardProps {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  budget?: number;
  status: 'Planning' | 'Upcoming' | 'Active' | 'Completed';
  onDelete: (id: number) => void;
  onShare: (id: number) => void;
}

// src/features/ItineraryBuilder/SortableItem.tsx
export interface SortableItemProps {
  id: number; // section_activity_id
  name: string;
  time?: string;
  expense: number;
  category: string;
}
```

---

## 8. Detailed Phased Implementation Instructions

### Phase 1: Environment & Project Scaffolding
**Goal:** Initialize the monorepo, set up the backend and frontend frameworks, and connect the database.

1. **Root Setup:**
   ```bash
   mkdir globetrotter && cd globetrotter
   git init
   mkdir backend frontend
   ```
2. **PostgreSQL Setup:**
   - Ensure PostgreSQL 16 is running on your machine on port 5432.
   - Execute: `createdb globetrotter_dev`
3. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   # On Windows: .\venv\Scripts\activate
   pip install fastapi uvicorn sqlalchemy alembic asyncpg pydantic-settings pydantic[email] passlib[bcrypt] python-jose[cryptography] pytest httpx
   mkdir -p app/core app/models app/schemas app/crud app/services app/api/routers app/seeds
   ```
   - Create `backend/.env` with `DATABASE_URL` and `JWT_SECRET`.
4. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm create vite@latest . -- --template react-ts
   npm install react-router-dom axios @tanstack/react-query react-hook-form @hookform/resolvers zod lucide-react recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities framer-motion clsx tailwind-merge
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

### Phase 2: Database Modeling & Migrations
**Goal:** Map the ERD to SQLAlchemy models and generate migrations.

1. **Write SQLAlchemy Models:**
   - In `backend/app/models/`, create files for User, Trip, TripSection, SectionActivity, City, and Activity (refer to Section 3.1 code).
2. **Alembic Initialization:**
   ```bash
   cd backend
   alembic init alembic
   ```
   - Update `alembic/env.py` to import `Base` from `app.models.base`.
   - Update `alembic.ini` with database URL.
3. **Run Migrations:**
   ```bash
   alembic revision --autogenerate -m "Initial schema setup"
   alembic upgrade head
   ```
4. **Seed Database:**
   - Create `app/seeds/static_data.json` with the JSON from Section 6.
   - Create `app/seeds/seed_data.py` to open the JSON, instantiate SQLAlchemy objects, and `session.commit()`.
   - Run `python -m app.seeds.seed_data`.

### Phase 3: Backend API Development & Business Logic
**Goal:** Expose REST APIs and implement intelligent engines.

1. **Implement Core Security:**
   - Write functions in `app/core/security.py` to hash passwords and generate JWTs.
   - Write the `get_current_user` dependency for FastAPI routes.
2. **Implement API Routers:**
   - Build CRUD routes in `app/api/routers/trips.py`. Ensure endpoints validate ownership (`trip.user_id == current_user.id`).
   - Build reorder endpoint that loops over ID arrays and bulk updates `sequence_order`.
3. **Implement Services:**
   - Write `budget_service.py` to aggregate Planned and Actual costs using `func.sum()`.
   - Write `health_service.py` to deduct points based on the deterministic rules outlined in Section 4.2.
   - Write `share_service.py` to handle deep cloning a Trip and its cascading entities in a single atomic transaction.

### Phase 4: Frontend Foundations & Component UI Kit
**Goal:** Setup global state, API clients, and the component library.

1. **API Client Setup:**
   - In `src/api/client.ts`, configure Axios to intercept requests and append the JWT from local storage. Handle 401 errors by clearing storage and redirecting to `/login`.
2. **React Query Configuration:**
   - In `src/main.tsx`, initialize `<QueryClientProvider>`. Configure `staleTime: 300000` (5 minutes) for optimal caching.
3. **Build UI Components:**
   - Build `<Button />`, `<Input />`, `<Card />` inside `src/components/`. Apply Tailwind classes referencing tokens (`bg-brand`, `text-foreground`).
4. **Auth Context:**
   - Create `AuthContext.tsx` to globally provide `user`, `login`, and `logout`.
   - Build a `<ProtectedRoute>` component to wrap application routes.

### Phase 5: Building the Core Application Interfaces
**Goal:** Assemble the final interfaces based on the UX guidelines.

1. **Dashboard & Auth:**
   - Build `/login` and `/register` with `react-hook-form` and `zod` resolvers.
   - Build Dashboard rendering a list of `<TripCard>` components fetched via `useTrips()`.
2. **Trip Workspace (The Hero Feature):**
   - Build a layout wrapper for `/trips/:tripId/*` containing the persistent Header (Trip Name, Dates) and Tab Navigation.
   - **Itinerary Builder (`dnd-kit`):**
     - Map over Days. Render a `<DayColumn>` for each date in the Trip.
     - Render `<SortableItem>` for each Activity.
     - Implement `onDragEnd` to optimistically update local state, then fire the `PUT /reorder` mutation. Rollback state if the API fails and show a `<Toast variant="danger">`.
   - **Budget Dashboard:**
     - Fetch data using `useBudget()`.
     - Render Recharts `<BarChart>` (Planned vs Actual total) and `<PieChart>` (Category Breakdown).
   - **Health Panel:**
     - Fetch data using `useHealth()`.
     - Display the score with `framer-motion` for a count-up effect. Render the "Move it for me" buttons for critical alerts.
3. **Public Story Sharing:**
   - Build the Share Tab calling `POST /share` to get a `public_slug`.
   - Build the Read-Only public view at `/t/:slug`. Render a "Copy Trip" button triggering the `/copy` endpoint.

### Phase 6: QA, Error Handling & Deployment Polish
**Goal:** Guarantee stability and offline resilience.

1. **Error Boundaries & Suspense:**
   - Wrap the main tree in an Error Boundary to catch crashes.
   - Ensure every loading state renders a skeleton UI rather than a blank screen or raw spinner.
2. **Offline Mode:**
   - Listen to `window.addEventListener('offline')` to display a sticky banner: "You're offline - changes are saved locally."
3. **Accessibility (a11y) Checks:**
   - Verify `dnd-kit` utilizes keyboard sensors so items can be moved with arrow keys.
   - Ensure all input fields have associated `<label>` tags.
   - Verify `aria-live` is used for Toast notifications.

---

## 9. Testing & CI/CD Strategy

### 9.1 Backend Testing (Pytest)
Write unit tests targeting the intelligent services to ensure math accuracy.
```python
# backend/tests/test_budget.py
def test_budget_aggregation(db_session, test_trip):
    # Setup test_trip with known sections and activities
    data = get_budget_breakdown(db_session, test_trip.id)
    assert data["total_planned"] == 500.00
    assert data["total_actual"] == 200.00
    assert data["variance"] == 300.00
```

### 9.2 Frontend Testing (Vitest + React Testing Library)
Write tests ensuring optimistic UI updates rollback correctly.
```typescript
// frontend/src/features/ItineraryBuilder/SortableItem.test.tsx
import { render, screen } from '@testing-library/react';
import { SortableItem } from './SortableItem';

test('renders activity name and expense', () => {
    render(<SortableItem id={1} name="Museum Tour" expense={50} category="culture" />);
    expect(screen.getByText('Museum Tour')).toBeInTheDocument();
    expect(screen.getByText('₹50.00')).toBeInTheDocument();
});
```

### 9.3 Manual E2E Validation Flow
Before any commit to `main`, execute this exact flow:
1. Register a new user -> Login.
2. Click "Create Trip", enter dates and ₹10,000 budget.
3. Visit "Discover", search for "Tokyo", add 3 activities.
4. Visit "Itinerary", drag an activity to Day 2.
5. Visit "Health", observe penalty for Empty Day 1. Click "Move it for me".
6. Visit "Share", copy link, open in Incognito window. Click "Copy Trip". Verify new trip loads.

---
*(End of Implementation Blueprint)*
