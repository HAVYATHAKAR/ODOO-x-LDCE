# 🌍 GlobeTrotter

### Personalized Multi-City Travel Planning Platform

> **One Trip. One Workspace. Plan Better. Travel Smarter.**

GlobeTrotter is a full-stack travel planning platform that brings **destination discovery, itinerary planning, budgeting, trip validation, optimization, and social sharing** into one unified workspace.

Instead of switching between maps, notes, spreadsheets, budgeting tools, and travel platforms, GlobeTrotter lets users manage their complete journey from a single application.

**🚧 Status:** In Development · Odoo Hackathon Project

---

## ✨ Key Features

### 🔐 Authentication

* User registration and login
* JWT-based authentication
* Secure password handling
* Password reset functionality
* Role-based administrative access

### 🏠 Personalized Dashboard

* View upcoming trips
* Track trip progress
* Monitor budgets
* View travel statistics
* Receive personalized suggestions

### 🗺️ Destination Discovery

* Search destinations
* Filter by country and region
* Explore destinations based on cost and interests
* Add destinations directly to trips

### 🎯 Activity Discovery

Discover activities based on:

* Category
* Cost
* Duration
* Difficulty

**Categories include:**

* 🏔️ Adventure
* 🌿 Nature
* 🏛️ Culture
* 🍜 Food
* 📸 Sightseeing
* 🛍️ Shopping
* 🌃 Nightlife
* 🧘 Relaxation

### 📝 Itinerary Builder

* Create day-by-day itineraries
* Add activities
* Set dates and times
* Add notes
* Set estimated costs
* Reorder activities
* Move activities between days

### 📅 Calendar & Timeline

* Visualize trips by day
* View scheduled activities
* Manage time blocks
* Reorder itinerary activities

### 💰 Budget Management

GlobeTrotter separates **planned costs** from **actual expenses**.

```text
                    TRIP BUDGET
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        PLANNED COSTS        ACTUAL EXPENSES
              │                     │
              └──────────┬──────────┘
                         │
                         ▼
                      VARIANCE
```

Supported expense categories:

* 🚆 Transport
* 🏨 Accommodation
* 🎟️ Activities
* 🍜 Food
* 📦 Miscellaneous

Users can track planned costs, record actual expenses, compare spending, analyze category-wise expenses, and identify potential budget problems.

### ❤️ Trip Health

Trip Health evaluates whether an itinerary is practical and balanced.

It can identify:

* ⚠️ Overloaded days
* 🕳️ Empty days
* 💰 Budget issues
* ⏰ Scheduling conflicts
* ⚖️ Poorly balanced itineraries

Example:

```text
⚠️ Day 4 is overloaded

09:00  Temple Visit
11:00  Museum
14:00  City Tour
17:00  Shopping
20:00  Dinner
```

**Recommendation:**

```text
Move Shopping → Day 5
```

The goal is not simply to identify problems, but to provide **explainable and actionable recommendations**.

### ⚡ Trip Optimization

* Move activities between days
* Reduce overloaded schedules
* Fill empty days
* Resolve scheduling conflicts
* Improve budget distribution
* Balance activities across the trip

### 🔗 Public Trip Sharing

Users can publish trips as public **Trip Stories**.

Other users can:

* Explore public trips
* View itineraries
* Like trips
* Comment
* Share experiences
* Copy trips
* Customize copied itineraries

---

# 🎯 Project Goal

Planning a multi-city trip often requires multiple applications for maps, notes, spreadsheets, budgeting, and itinerary management.

GlobeTrotter aims to solve this by providing a single **Trip Workspace** where users can:

```text
DISCOVER → PLAN → VALIDATE → OPTIMIZE → SHARE
```

Everything related to a trip is managed from one place.

---

# 🧠 Core Concept

## One Trip → One Workspace

Different features represent different views of the same trip:

```text
                     ┌───────────────┐
                     │     TRIP      │
                     └───────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
          DISCOVER        ITINERARY      CALENDAR
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
                  BUDGET          TRIP HEALTH
                    │                 │
                    └────────┬────────┘
                             ▼
                           SHARE
```

### Explainable Intelligence

Recommendations and warnings should clearly explain **why** they were generated.

### Planned ≠ Actual

Estimated costs and actual expenses are tracked separately.

### Real Data

Trip statistics, budgets, readiness, and health indicators are calculated from actual application data.

---

# 🏗️ Architecture

```text
┌─────────────────────────────────────┐
│             React UI                │
│       TypeScript + Vite             │
│           Tailwind CSS              │
└──────────────────┬──────────────────┘
                   │
                   │ REST API
                   ▼
┌─────────────────────────────────────┐
│              FastAPI                │
│             Backend                 │
└──────────────────┬──────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│   SQLAlchemy    │ │     Alembic     │
│      ORM        │ │    Migrations   │
└────────┬────────┘ └─────────────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL 16  │
└─────────────────┘
```

---

# 🛠️ Tech Stack

| Layer          | Technology     |
| -------------- | -------------- |
| Frontend       | React          |
| Language       | TypeScript     |
| Build Tool     | Vite           |
| Styling        | Tailwind CSS   |
| Backend        | Python         |
| API Framework  | FastAPI        |
| ORM            | SQLAlchemy 2.0 |
| Database       | PostgreSQL 16  |
| Migrations     | Alembic        |
| Authentication | JWT            |
| Communication  | REST API       |

---

# 📂 Project Structure

```text
ODOO-x-LDCE/
│
├── doc/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── REST_API_Specification.md
│   ├── UIUX.md
│   ├── UI_UX.md
│   └── action_plan.md
│
├── backend/
│   └── ...
│
├── frontend/
│   └── ...
│
├── README.md
└── ...
```

> The implementation structure may evolve as development continues.

---

# 📚 Documentation

Detailed project documentation is available in the [`doc/`](./doc/) directory.

| Document                                    | Description                    |
| ------------------------------------------- | ------------------------------ |
| [PRD](./doc/PRD.md)                         | Product Requirements Document  |
| [Architecture](./doc/ARCHITECTURE.md)       | System architecture            |
| [Database](./doc/DATABASE.md)               | Database design and data model |
| [REST API](./doc/REST_API_Specification.md) | REST API specification         |
| [UI/UX](./doc/UIUX.md)                      | UI/UX specifications           |
| [Action Plan](./doc/action_plan.md)         | Development action plan        |

---

# 🔄 User Flow

```text
┌──────────────┐
│    CREATE    │
│     TRIP     │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│    DISCOVER     │
│ Cities /        │
│ Activities      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      PLAN       │
│   Itinerary     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    VALIDATE     │
│ Budget + Health │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    OPTIMIZE     │
│ Recommendations │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     SHARE       │
│   Trip Story    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ COPY & CUSTOMIZE│
└─────────────────┘
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have the following installed:

* Git
* Python 3.x
* Node.js
* npm
* PostgreSQL 16

---

## 1. Clone the Repository

```bash
git clone https://github.com/HAVYATHAKAR/ODOO-x-LDCE.git
cd ODOO-x-LDCE
```

---

## 2. Backend Setup

Create a virtual environment:

```bash
python -m venv .venv
```

### Linux / macOS

```bash
source .venv/bin/activate
```

### Windows

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 3. Configure Environment Variables

Create a `.env` file and configure your database and authentication settings.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/globetrotter
SECRET_KEY=your-secret-key
```

> ⚠️ Never commit your `.env` file or production secrets to GitHub.

---

## 4. Setup Database

Create the PostgreSQL database and run migrations:

```bash
alembic upgrade head
```

---

## 5. Start Backend

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

## 6. Start Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🔒 Security

GlobeTrotter is designed with security and user privacy in mind.

* Passwords are never stored as plaintext
* JWT is used for authentication
* Password reset tokens are temporary
* Private trips are accessible only to their owners
* Administrative functionality is role-protected
* Authentication errors avoid exposing sensitive information

---

# 🚫 MVP Non-Goals

The current MVP does not focus on:

* Real-time multi-user collaboration
* Native mobile applications
* Payment processing
* Booking transactions
* Machine-learning models
* Required third-party maps or booking APIs

The primary goal is to deliver a **complete web-based travel-planning experience**.

---

# 🧪 Development Workflow

Create a feature branch:

```bash
git checkout -b feature/your-feature
```

Make your changes:

```bash
git add .
```

Commit your changes:

```bash
git commit -m "feat: add your feature"
```

Push your branch:

```bash
git push origin feature/your-feature
```

Then create a Pull Request.

---

# 🤝 Contributing

Contributions are welcome!

When submitting a Pull Request, please include:

* What you changed
* Why you changed it
* How you tested it
* Any known limitations

---

# 📌 Project Status

🚧 **Currently in development**

GlobeTrotter is being developed as an **Odoo Hackathon project** with the goal of creating a complete, intuitive, and intelligent multi-city travel-planning platform.

---

# 👨‍💻 Team

### GlobeTrotter — Odoo Hackathon

Built with ❤️ for the Odoo Hackathon.

---

# 📄 License

License information will be added once the project's licensing decision is finalized.

---

# ⭐ Support

If you like the project:

⭐ Star the repository
🍴 Fork the repository
🐛 Report bugs
💡 Suggest improvements
🔧 Submit Pull Requests

---

<div align="center">

## 🌍 Plan Better. Travel Smarter. Share the Journey.

**GlobeTrotter — Your entire trip, one intelligent workspace.**

</div>
