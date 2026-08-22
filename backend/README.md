# GlobeTrotter — Backend API

Multi-city travel-planning API for the GlobeTrotter app. Plan trips as a sequence
of **sections** (transport, accommodation, sightseeing, food, …), attach catalog or
custom activities to each, and get a live **budget breakdown** and **Trip Health**
score — plus public sharing, one-click trip copying, and a small community layer.

Built with **FastAPI + SQLAlchemy 2.0 (sync) + Alembic + Pydantic v2**. Targets
**PostgreSQL 16** in production but stays **SQLite-portable**, so the app and the
full test suite run locally with zero database setup.

---

## Table of contents

- [Requirements](#requirements)
- [Quickstart — SQLite (zero setup)](#quickstart--sqlite-zero-setup)
- [Running on PostgreSQL](#running-on-postgresql)
- [Docker Compose](#docker-compose)
- [Seeding demo data](#seeding-demo-data)
- [Running the tests](#running-the-tests)
- [Configuration](#configuration)
- [Project layout](#project-layout)
- [Architecture](#architecture)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Budget engine & Trip Health](#budget-engine--trip-health)
- [Security notes](#security-notes)

---

## Requirements

- **Python 3.10+** (the Docker image uses 3.11)
- For the Postgres path: **PostgreSQL 16**, or **Docker + Docker Compose**
- No database server is required for local development or tests (SQLite is used)

---

## Quickstart — SQLite (zero setup)

The fastest way to get a running API. No database server, no migrations.

```bash
cd backend

# 1. Create a virtualenv and install runtime deps
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
#    then edit .env and set:
#      DATABASE_URL=sqlite:///./globetrotter.db
#      JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(48))")

# 3. (optional) Load demo cities, activities, and two sample trips
python -m app.seeds.seed_data

# 4. Run the API
uvicorn app.main:app --reload
```

Then open:

- Swagger UI  → http://localhost:8000/docs
- ReDoc       → http://localhost:8000/redoc
- Health ping → http://localhost:8000/health

On the SQLite path the schema is created automatically at startup
(`Base.metadata.create_all`) — Alembic is **not** required. Use
`DATABASE_URL=sqlite://` (no file) for a pure in-memory database.

---

## Running on PostgreSQL

Production uses Postgres, where **Alembic owns the schema** (the startup
auto-create is skipped whenever `DATABASE_URL` is not SQLite).

```bash
# 1. Point DATABASE_URL at your Postgres instance in .env, e.g.:
#    DATABASE_URL=postgresql+psycopg2://globetrotter:globetrotter@localhost:5432/globetrotter

# 2. Apply migrations (creates all tables + Postgres-only enhancements)
alembic upgrade head

# 3. (optional) Seed demo data
python -m app.seeds.seed_data

# 4. Serve
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The initial migration (`alembic/versions/0001_initial_schema.py`) additionally
enables Postgres-only features that are safely skipped on SQLite:

- `citext` extension → case-insensitive `users.username` / `users.email`
- `pg_trgm` extension + trigram **GIN** indexes on `cities.name` and
  `activities.name` for fast fuzzy search
- the `(trip_id, sequence_order)` uniqueness on sections becomes
  `DEFERRABLE INITIALLY IMMEDIATE`

---

## Docker Compose

Brings up Postgres 16 + the API together:

```bash
cd backend
docker compose up --build
# API:  http://localhost:8000     Docs: http://localhost:8000/docs
```

The `api` container runs `alembic upgrade head` before serving. Seed demo data in
a one-off container:

```bash
docker compose run --rm api python -m app.seeds.seed_data
```

> The compose file sets a throwaway `JWT_SECRET` for local use only. Set a real
> one via the environment before any non-local deployment.

---

## Seeding demo data

```bash
python -m app.seeds.seed_data
```

The loader is **idempotent** — safe to run repeatedly. It upserts the static
catalog (8 cities, 37 activities) and creates demo content:

| Account | Username | Password    | Notes                                             |
| ------- | -------- | ----------- | ------------------------------------------------- |
| Demo    | `demo`   | `demo1234`  | Owns "Rajasthan Explorer" (private, 5 days)       |
| Admin   | `admin`  | `admin1234` | Admin role; owns "Goa Getaway" (public)           |

The public "Goa Getaway" trip is shared at slug **`demo-goa-share`** with budgets
visible — fetch it at `GET /api/v1/public/trips/demo-goa-share`. The Rajasthan
trip deliberately packs day 2 with 5 activities so the Trip Health engine emits an
`overpacked_day` insight you can demo the "move it for me" fix against.

> Change these demo credentials before exposing the instance anywhere public.

---

## Running the tests

Tests run against **in-memory SQLite** — no server, no `.env` needed (the test
config sets its own environment in `tests/conftest.py`).

```bash
pip install -r requirements-dev.txt
pytest
```

The suite (`tests/`) covers auth & token flows, budget math, Trip Health scoring
and the rebalancer, trip CRUD + ownership enforcement, section/activity reorder,
and public share/copy privacy behavior.

---

## Configuration

All settings load from environment / `.env` (see `.env.example`). **Never commit
your real `.env`** — it is git-ignored; only `.env.example` is tracked.

| Variable             | Default (example)                          | Purpose                                              |
| -------------------- | ------------------------------------------ | ---------------------------------------------------- |
| `DATABASE_URL`       | `postgresql+psycopg2://…/globetrotter`     | SQLAlchemy URL. Use `sqlite:///./globetrotter.db` for local. |
| `JWT_SECRET`         | *(required)*                               | HMAC secret for signing JWTs. Generate a long random string. |
| `JWT_ALGORITHM`      | `HS256`                                    | JWT signing algorithm.                               |
| `JWT_ACCESS_MINUTES` | `15`                                       | Access-token lifetime.                               |
| `JWT_REFRESH_DAYS`   | `7`                                        | Refresh-token lifetime.                              |
| `RESET_TOKEN_MINUTES`| `30`                                       | Password-reset token lifetime.                       |
| `CORS_ORIGINS`       | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed SPA origins.              |
| `PROJECT_NAME`       | `GlobeTrotter`                             | Shown in docs / root endpoint.                       |
| `API_V1_PREFIX`      | `/api/v1`                                  | Prefix for all API routes.                           |
| `ENVIRONMENT`        | `development`                              | In `development`, password-reset responses expose the token for testing. |

Generate a strong secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

---

## Project layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app: CORS, exception handlers, router wiring, SQLite bootstrap
│   ├── core/                # config (pydantic-settings), database (engine/session), security (JWT+bcrypt), exceptions
│   ├── models/              # SQLAlchemy 2.0 models — 11 tables (authoritative schema)
│   ├── schemas/             # Pydantic v2 request/response models
│   ├── crud/                # data-access layer (one module per aggregate)
│   ├── services/            # business logic: budget, health, share/copy, auth
│   ├── api/
│   │   ├── deps.py          # auth/ownership dependencies
│   │   └── routers/         # one router per domain, aggregated into api_router
│   └── seeds/               # static_data.json + idempotent seed loader
├── alembic/                 # migration environment + 0001_initial_schema.py
├── tests/                   # pytest suite (in-memory SQLite)
├── requirements.txt         # runtime deps
├── requirements-dev.txt     # + pytest, httpx
├── Dockerfile
├── docker-compose.yml       # Postgres 16 + API
└── .env.example
```

---

## Architecture

A clean, layered flow keeps HTTP concerns, business rules, and persistence
separate:

```
Router  →  Service  →  CRUD  →  Models
(HTTP)     (rules)     (queries)  (ORM/DB)
```

- **Routers** validate input via Pydantic schemas, resolve the current user /
  owned trip through dependencies, and translate results to response models.
- **Services** hold the non-trivial logic (budget aggregation, health scoring and
  rebalancing, share/copy).
- **CRUD** modules own all SQLAlchemy queries.
- **Models** are the single source of truth for the schema; the Alembic migration
  mirrors them exactly.

Domain errors are raised as typed exceptions (`AppError` subclasses:
`BadRequestError` 400, `AuthError` 401, `PermissionDeniedError` 403,
`NotFoundError` 404, `ConflictError` 409) and mapped to clean JSON responses;
database `IntegrityError`s become `409`s.

**Portability** is achieved by keeping models dialect-neutral
(`BigInteger().with_variant(Integer, "sqlite")` for PKs), doing case-insensitive
identity in app code on SQLite while using `CITEXT` on Postgres, enabling SQLite
foreign-key enforcement via a connect-time pragma, and confining all
Postgres-specific features to the migration.

---

## Data model

Eleven tables, created in FK-dependency order:

`users`, `cities`, `activities`, `password_reset_tokens`, `trips`,
`trip_sections`, `section_activities`, `community_posts`, `community_comments`,
`community_likes`, `saved_destinations`.

The core hierarchy is **User → Trip → TripSection → SectionActivity**. A section
carries a planned `budget`; each activity carries an actual `expense` and links to
either a catalog `activity_id` **or** a `custom_name` (never neither). Trips can be
made public (slug-addressable) and can record `copied_from_trip_id` provenance when
copied from another public trip.

---

## API reference

All routes are served under the `API_V1_PREFIX` (default **`/api/v1`**). Full
interactive documentation is available at `/docs` (Swagger) and `/redoc`.
🔒 = requires a bearer access token; 👑 = requires an admin account.

### Meta
| Method | Path       | Description                    |
| ------ | ---------- | ------------------------------ |
| GET    | `/`        | Service info + environment     |
| GET    | `/health`  | Liveness probe                 |

### Auth — `/auth`
| Method | Path                     | 🔒 | Description                                   |
| ------ | ------------------------ | -- | --------------------------------------------- |
| POST   | `/auth/register`         |    | Create account, returns profile + token pair  |
| POST   | `/auth/login`            |    | Login by username **or** email                |
| POST   | `/auth/refresh`          |    | Exchange a refresh token for a new pair        |
| POST   | `/auth/forgot-password`  |    | Issue a single-use reset token                 |
| POST   | `/auth/reset-password`   |    | Consume the reset token, set a new password    |
| GET    | `/auth/me`               | 🔒 | Current user profile                           |
| POST   | `/auth/change-password`  | 🔒 | Change password while logged in                |
| POST   | `/auth/logout`           | 🔒 | Logout                                         |

### Profile — `/users`
| Method | Path         | 🔒 | Description                 |
| ------ | ------------ | -- | --------------------------- |
| GET    | `/users/me`  | 🔒 | Get profile                 |
| PUT    | `/users/me`  | 🔒 | Update profile              |
| DELETE | `/users/me`  | 🔒 | Delete account              |

### Dashboard
| Method | Path         | 🔒 | Description                                  |
| ------ | ------------ | -- | -------------------------------------------- |
| GET    | `/dashboard` | 🔒 | Aggregated view of the user's trips/stats    |

### Trips — `/trips`
| Method | Path                                  | 🔒 | Description                                    |
| ------ | ------------------------------------- | -- | ---------------------------------------------- |
| POST   | `/trips`                              | 🔒 | Create a trip                                  |
| GET    | `/trips`                              | 🔒 | List the user's trips (paginated)              |
| GET    | `/trips/{trip_id}`                    | 🔒 | Trip detail with sections + activities         |
| PUT    | `/trips/{trip_id}`                    | 🔒 | Update a trip                                  |
| DELETE | `/trips/{trip_id}`                    | 🔒 | Delete a trip                                  |
| GET    | `/trips/{trip_id}/budget`             | 🔒 | Budget summary + per-category breakdown        |
| GET    | `/trips/{trip_id}/health`             | 🔒 | Trip Health score + insights                   |
| POST   | `/trips/{trip_id}/health/move-it-for-me` | 🔒 | Auto-rebalance overpacked days              |
| POST   | `/trips/{trip_id}/share`              | 🔒 | Publish the trip (mint a public slug)          |
| DELETE | `/trips/{trip_id}/share`              | 🔒 | Unpublish the trip                             |

### Sections & activities — `/trips/{trip_id}/sections`
| Method | Path                                                     | 🔒 | Description                          |
| ------ | -------------------------------------------------------- | -- | ------------------------------------ |
| POST   | `/…/sections`                                            | 🔒 | Add a section (auto-sequenced)       |
| GET    | `/…/sections`                                            | 🔒 | List sections                        |
| PUT    | `/…/sections/reorder`                                    | 🔒 | Reorder sections (two-phase)         |
| GET    | `/…/sections/{section_id}`                               | 🔒 | Get a section                        |
| PUT    | `/…/sections/{section_id}`                               | 🔒 | Update a section                     |
| DELETE | `/…/sections/{section_id}`                               | 🔒 | Delete a section                     |
| POST   | `/…/sections/{section_id}/activities`                    | 🔒 | Add activity (catalog or custom)     |
| PUT    | `/…/sections/{section_id}/activities/reorder`            | 🔒 | Reorder activities within a section  |
| PUT    | `/…/sections/{section_id}/activities/{item_id}`          | 🔒 | Update an activity                   |
| DELETE | `/…/sections/{section_id}/activities/{item_id}`          | 🔒 | Remove an activity                   |

### Catalog — `/cities`, `/activities`
| Method | Path                          | 🔒 | Description                                 |
| ------ | ----------------------------- | -- | ------------------------------------------- |
| GET    | `/cities`                     |    | Search/browse cities (paginated)            |
| GET    | `/cities/{city_id}`           |    | City detail                                 |
| GET    | `/cities/{city_id}/activities`|    | Activities in a city (paginated)            |
| POST   | `/cities`                     | 👑 | Create a city                               |
| PUT    | `/cities/{city_id}`           | 👑 | Update a city                               |
| DELETE | `/cities/{city_id}`           | 👑 | Delete a city                               |
| GET    | `/activities`                 |    | Search/browse activities (paginated)        |
| GET    | `/activities/{activity_id}`   |    | Activity detail                             |
| POST   | `/activities`                 | 👑 | Create an activity                          |
| PUT    | `/activities/{activity_id}`   | 👑 | Update an activity                          |
| DELETE | `/activities/{activity_id}`   | 👑 | Delete an activity                          |

### Community — `/community`
| Method | Path                                        | 🔒 | Description                          |
| ------ | ------------------------------------------- | -- | ------------------------------------ |
| GET    | `/community/posts`                          |    | List posts (paginated)               |
| POST   | `/community/posts`                          | 🔒 | Create a post (optionally from a trip)|
| GET    | `/community/posts/{post_id}`                |    | Post detail                          |
| PUT    | `/community/posts/{post_id}`                | 🔒 | Edit own post                        |
| DELETE | `/community/posts/{post_id}`                | 🔒 | Delete own post                      |
| POST   | `/community/posts/{post_id}/like`           | 🔒 | Toggle like                          |
| GET    | `/community/posts/{post_id}/comments`       |    | List comments                        |
| POST   | `/community/posts/{post_id}/comments`       | 🔒 | Add a comment                        |
| DELETE | `/community/posts/{post_id}/comments/{id}`  | 🔒 | Delete own comment                   |

### Saved destinations — `/saved`
| Method | Path                | 🔒 | Description                    |
| ------ | ------------------- | -- | ------------------------------ |
| GET    | `/saved`            | 🔒 | List saved cities              |
| POST   | `/saved`            | 🔒 | Save a city                    |
| DELETE | `/saved/{city_id}`  | 🔒 | Remove a saved city            |

### Public sharing — `/public`
| Method | Path                          | 🔒 | Description                                            |
| ------ | ----------------------------- | -- | ------------------------------------------------------ |
| GET    | `/public/trips/{slug}`        |    | Read-only public itinerary (budgets hidden unless opted in) |
| POST   | `/public/trips/{slug}/copy`   | 🔒 | Deep-copy a public trip into your account              |

### Admin — `/admin`
| Method | Path               | 🔒 | Description                          |
| ------ | ------------------ | -- | ------------------------------------ |
| GET    | `/admin/overview`  | 👑 | Platform metrics                     |
| GET    | `/admin/users`     | 👑 | List users (paginated)               |

---

## Budget engine & Trip Health

**Budget.** Planned spend is the sum of section budgets; actual spend is the sum of
activity expenses. Both are grouped by `section_type` for the breakdown. When a
trip has a `total_budget`, `variance = target − planned` and `per_day = planned /
num_days`; with no target, variance is `null`.

**Trip Health** starts at **100** and applies penalties:

- **Empty trip** (no sections): −20, insight `empty_trip`.
- **Over budget** (planned spend exceeds the target): a scaled penalty capped at 30,
  insight `over_budget`.
- **Overpacked day** (more than **4** activities in a single day): −5 per offending
  day, insight `overpacked_day` carrying a `move_it_for_me` action and the specific
  `day`.

Ratings: `excellent ≥ 85`, `good ≥ 70`, `fair ≥ 50`, else `poor`.
`POST /trips/{id}/health/move-it-for-me` greedily repacks activities to ≤ 4 per day
starting from the trip's start date, clearing overpacked-day penalties.

---

## Security notes

- **Passwords** are hashed with **bcrypt** (via passlib); plaintext is never stored
  or echoed back in any response.
- **JWTs** carry the user identity; `user_id` is always derived from the token —
  never trusted from a request body.
- **Ownership** is enforced by dependencies (`get_owned_trip`) so users can only
  read/modify their own trips (403 otherwise).
- **Password-reset tokens** are single-use and stored only as a **SHA-256 hash**;
  the raw token is returned in the API response **only** when `ENVIRONMENT=development`
  (for local testing) — in production it should be delivered out-of-band (email).
- **Secrets** live in `.env`, which is git-ignored. Set a strong `JWT_SECRET` and
  change the seeded demo/admin credentials before any public deployment.
