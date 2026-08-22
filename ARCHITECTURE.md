# 🏛️ Architecture — GlobeTrotter

> How the system is put together: the layers, the request lifecycle, and the decisions behind them. Pairs with [DATABASE.md](./DATABASE.md), [API.md](./API.md), and [UIUX.md](./UIUX.md).

---

## 1. System Overview

```mermaid
flowchart LR
    subgraph Client["React SPA (Vite + TS)"]
        UI[Pages & Components]
        RQ[TanStack Query cache]
        AX[Typed API client]
        UI --> RQ --> AX
    end

    subgraph Server["FastAPI (Python)"]
        R[Routers / API layer]
        S[Services / business logic]
        C[CRUD / data access]
        M[SQLAlchemy models]
        R --> S --> C --> M
    end

    DB[(PostgreSQL 16)]

    AX -- HTTPS / JSON + JWT --> R
    M -- SQL --> DB
```

**Three tiers, one direction of dependency:** React → FastAPI → PostgreSQL. The front end never talks to the DB directly; the DB is reached only through the service/CRUD layers. Everything is **our own code** — no BaaS, no external data APIs.

---

## 2. Backend Architecture (FastAPI)

A **layered** design keeps HTTP, business rules, and persistence separate — each testable in isolation. This directly serves the *modularity*, *scalability*, and *coding-pattern* criteria.

```
backend/app/
├── main.py                 # app factory, router registration, middleware, CORS
├── core/
│   ├── config.py           # env-driven settings (pydantic-settings)
│   ├── database.py         # engine, SessionLocal, get_db dependency
│   └── security.py         # password hashing, JWT encode/decode, deps (get_current_user)
├── models/                 # SQLAlchemy ORM — one file per aggregate
│   ├── user.py  trip.py  section.py  section_activity.py  activity.py  city.py  community.py ...
├── schemas/                # Pydantic v2 — request & response DTOs (validation lives here)
│   ├── auth.py  trip.py  section.py  activity.py  city.py  budget.py  community.py ...
├── crud/                   # thin data-access functions (no HTTP, no business rules)
├── services/               # business logic (budget calc, trip copy/share slug, section reorder, community)
├── api/
│   ├── deps.py             # shared deps (current user, ownership, list-query parser: search/filter/sort/group_by)
│   └── routers/            # auth, trips, sections, activities, cities, budget, users, community, calendar, public, admin
├── seeds/                  # city & activity seed loaders (run once)
└── tests/
```

### Request lifecycle
`Router` (parse + validate via Pydantic schema, resolve `current_user`) → `Service` (enforce rules, e.g. ownership, budget math) → `CRUD` (query/commit through the ORM) → response serialized by a Pydantic response schema. Errors bubble up as typed HTTP exceptions with a consistent JSON body.

### Why FastAPI
- **Pydantic validation is free and typed** — the "robust input validation / graceful errors" criterion is met by the framework's design, returning structured `422` field errors.
- **Auto OpenAPI docs** at `/docs` — instant, credible API surface for the demo.
- **Async-capable** and fast — good story for the *performance/scalability* criteria.

---

## 3. Frontend Architecture (React + Vite + TS)

**Feature-sliced** structure — code grouped by domain feature, not by file type — so each teammate can own a feature end-to-end (good for parallel Git work).

```
frontend/src/
├── main.tsx / App.tsx / router.tsx
├── api/
│   ├── client.ts           # fetch/axios wrapper: base URL, JWT header, error normalization
│   └── endpoints/          # typed functions per resource (trips, cities, ...)
├── context/AuthContext.tsx # holds session, guards routes
├── components/             # design-system primitives: Button, Input, Card, Modal, Chart, Layout
├── features/
│   ├── auth/               # login (username), register, forgot-password
│   ├── trips/              # create, list (ongoing/upcoming/completed), cards
│   ├── itinerary/          # Sections builder, day-wise view, drag-drop
│   ├── search/             # city & activity search
│   ├── budget/             # breakdown charts (planned vs actual)
│   ├── community/          # feed, post composer, likes/comments
│   ├── calendar/           # month calendar of all trips
│   └── admin/              # manage users, popular cities/activities, analytics
├── components/ListToolbar  # shared Search + Group by + Filter + Sort by (used on all list screens)
├── pages/                  # route-level screens (map to the 12 screens)
├── hooks/                  # useAuth, useTrips, useDebounce ...
└── styles/tokens.css       # design tokens (colour, type, spacing) — single source of truth
```

- **Server state** via TanStack Query (caching, refetch, optimistic updates for drag-reorder) → the UI feels live and dynamic.
- **Forms** via React Hook Form + Zod; the Zod schema mirrors the backend Pydantic rules so validation messages are consistent on both sides.
- **Routing** via React Router with a `<ProtectedRoute>` wrapper reading `AuthContext`.

---

## 4. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as React
    participant A as FastAPI /auth
    participant DB as PostgreSQL
    U->>A: POST /auth/login {username, password}
    A->>DB: fetch user by username
    A->>A: bcrypt.verify(password, hash)
    A-->>U: { access_token (15m), refresh_token (7d) }
    U->>A: GET /trips  (Authorization: Bearer access)
    A->>A: decode JWT → user_id; load current_user
    A->>DB: SELECT trips WHERE user_id = current_user
    A-->>U: only the user's trips
```

- **Passwords:** hashed with **bcrypt** (passlib). Never stored or logged in plaintext.
- **Tokens:** short-lived access JWT + longer refresh JWT; `get_current_user` dependency decodes and loads the user on every protected route.
- **Ownership checks:** services assert `trip.user_id == current_user.id` before any read/write — a user can never touch another's trip.
- **Public sharing:** the only unauthenticated data route is `GET /public/{slug}`, and it returns a trip **only if** `is_public = true`.
- **Admin:** `is_admin` gate on `/admin/*`.

---

## 5. Validation Strategy (two layers, one contract)

| Layer | Tool | Responsibility |
|-------|------|----------------|
| Client | Zod + React Hook Form | Instant feedback, prevent obviously-bad submits |
| Server | Pydantic v2 schemas | **Authoritative** validation; never trusts the client |
| DB | CHECK / UNIQUE / FK constraints | Last line of defense; integrity guaranteed even against bugs |

Example — invalid email returns:
```json
{ "detail": [ { "field": "email", "message": "value is not a valid email address" } ] }
```
The same rule set (email format, password length, `end_date ≥ start_date`, non-negative costs) is expressed in all three layers.

---

## 6. Security Checklist

- ✅ bcrypt password hashing; configurable cost factor
- ✅ JWT with expiry; refresh rotation
- ✅ Per-resource ownership enforcement
- ✅ Password reset via hashed, single-use, expiring tokens
- ✅ Pydantic input validation on every endpoint (rejects extra/typed-wrong fields)
- ✅ SQL injection safe (ORM parameterization; no string-built SQL)
- ✅ CORS locked to the frontend origin
- ✅ Secrets via environment variables (`.env`, never committed)
- ✅ Soft-delete for accounts (no data orphaning)
- ⭘ (stretch) rate limiting on `/auth/*`

---

## 7. Scalability & Performance

- **Stateless API** (JWT, no server sessions) → horizontally scalable behind a load balancer.
- **Indexed queries** for every list/search path (see [DATABASE §5](./DATABASE.md#5-indexing-strategy-tuned-to-real-queries)).
- **Pagination** on list endpoints (`limit`/`offset`) to bound payloads.
- **N+1 avoided** via SQLAlchemy eager loading (`selectinload`) when fetching a trip with its sections & activities.
- **Cacheable reference data** (cities/activities) — front end caches via TanStack Query.

---

## 8. Dependency Philosophy

Odoo asks to *build from scratch with minimal third-party APIs*. Our reading and stance:

- **No external data services or APIs.** No Firebase/Supabase/Mongo Atlas; no Google Maps/Places; no third-party auth. All cities, activities, costs, and geo-coordinates live in **our** PostgreSQL and are served by **our** API.
- **Libraries ≠ external services.** We use well-understood open-source *libraries* (FastAPI, SQLAlchemy, React, TanStack Query, Recharts, dnd-kit) as engineering tooling — not as a substitute for building the product. Each is listed with its purpose in the [README stack table](../README.md#️-tech-stack), and the team can explain *why* each is used (per the "understand your tools" expectation).
- **Real, dynamic data** everywhere at runtime; static JSON only ever used transiently during early prototyping, never in the shipped build.

---

## 9. Testing Approach

| Level | What | Tool |
|-------|------|------|
| Unit | Budget aggregation, trip-copy, slug generation | pytest |
| API | Auth flow, ownership rejection, validation errors, CRUD happy paths | pytest + httpx TestClient |
| DB | Constraint enforcement (e.g. `end_date ≥ start_date`) | pytest against a test DB |
| Frontend | Critical components & form validation | Vitest + React Testing Library |

A minimal but meaningful suite (auth, ownership, budget math, one full itinerary flow) is the target — enough to demonstrate the *debugging/quality* criterion without over-investing for the timeline.

---

## 10. Environment & Configuration

`.env` (backend): `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`, `CORS_ORIGINS`.
`.env` (frontend): `VITE_API_URL`.
Both ship with a committed `.env.example`; real secrets never enter Git.
