🌍 GlobeTrotter
Personalized Multi-City Travel Planning Platform

GlobeTrotter is a smart travel-planning platform that brings destination discovery, itinerary planning, budgeting, trip validation, optimization, and sharing into one seamless workspace.

🚧 Status: In Development — Odoo Hackathon Project

✨ Features

🔐 Authentication

User registration and login
JWT-based authentication
Secure password handling
Password reset functionality

🏠 Dashboard

View upcoming trips
Track trip progress
Monitor budgets
View travel statistics
Get personalized suggestions

🗺️ Destination Discovery

Search destinations
Filter by country and region
Explore destinations based on cost and interests
Add destinations directly to trips

🎯 Activity Discovery

Discover activities for destinations
Filter by category, cost, duration, and difficulty
Categories include:
Adventure
Nature
Culture
Food
Sightseeing
Shopping
Nightlife
Relaxation

📝 Itinerary Builder

Create day-by-day itineraries
Add activities
Set dates and times
Add notes
Set estimated costs
Reorder activities
Move activities between days

📅 Calendar & Timeline

Visualize trips by day
View scheduled activities
Manage time blocks
Reorder itinerary activities

💰 Budget Management

Track planned costs
Track actual expenses
Compare planned vs actual spending
View category-wise spending
Identify expensive days
Detect budget problems

❤️ Trip Health

Detect overloaded days
Identify empty days
Detect budget issues
Identify scheduling conflicts
Provide explainable recommendations

⚡ Trip Optimization

Suggest itinerary improvements
Move activities between days
Reduce overloaded schedules
Improve trip balance

🔗 Public Trip Sharing

Publish trips publicly
Share trip itineraries
Allow other users to explore trips
Copy shared trips into personal accounts

👥 Community

Discover public trips
Like trips
Comment on posts
Share travel experiences
🎯 Project Goal

Planning a multi-city trip often requires using multiple applications for maps, notes, spreadsheets, budgeting, and itinerary management.

GlobeTrotter aims to solve this problem by providing a single Trip Workspace where users can:

Discover → Plan → Validate → Optimize → Share


Everything related to a trip is managed from one place.

🧠 Core Concept

GlobeTrotter follows a simple product philosophy:

One Trip → One Workspace

The following are different views of the same trip:

Discover
Itinerary
Calendar
Budget
Trip Health
Share
Explainable Intelligence

Recommendations and warnings should clearly explain why they were generated.

Planned ≠ Actual

Estimated costs and actual expenses are tracked separately.

Real Data

Trip statistics, budgets, readiness, and health indicators are calculated from actual application data.

🏗️ Architecture
                    ┌─────────────────────┐
                    │      React UI       │
                    │   TypeScript/Vite   │
                    │      Tailwind       │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │       FastAPI       │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             ┌──────────────┐      ┌──────────────┐
             │  SQLAlchemy  │      │    Alembic   │
             │     ORM      │      │  Migrations  │
             └──────┬───────┘      └──────────────┘
                    │
                    ▼
             ┌──────────────┐
             │ PostgreSQL 16│
             └──────────────┘

🛠️ Tech Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
Backend
Python
FastAPI
SQLAlchemy 2.0
Alembic
Database
PostgreSQL 16
Authentication
JWT
API
REST API
📂 Project Structure
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


The exact implementation structure may evolve as development continues.

📚 Documentation

Detailed project documentation is available in the doc/ directory.

Document	Description
PRD	Product Requirements Document
Architecture	System architecture
Database	Database design and data model
REST API	REST API specification
UI/UX	UI/UX specifications
UI/UX	Additional UI/UX documentation
Action Plan	Development action plan
🔄 User Flow
                    ┌──────────────┐
                    │    CREATE    │
                    │     TRIP     │
                    └──────┬───────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    DISCOVER     │
                  │ Cities/Activity│
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
                  │ Fix Suggestions │
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
                  │   COPY TRIP     │
                  │   & Customize   │
                  └─────────────────┘

🚀 Getting Started
Prerequisites

Make sure you have the following installed:

Git
Python 3.x
Node.js
PostgreSQL 16
npm
1. Clone the Repository
git clone https://github.com/HAVYATHAKAR/ODOO-x-LDCE.git
cd ODOO-x-LDCE

2. Backend Setup

Create a virtual environment:

python -m venv .venv

Linux / macOS
source .venv/bin/activate

Windows
.venv\Scripts\activate


Install dependencies:

pip install -r requirements.txt

3. Configure Environment Variables

Create a .env file and configure your database and authentication settings.

Example:

DATABASE_URL=postgresql://username:password@localhost:5432/globetrotter
SECRET_KEY=your-secret-key

4. Setup Database

Create a PostgreSQL database and run migrations:

alembic upgrade head

5. Start Backend
uvicorn app.main:app --reload


Backend:

http://localhost:8000


API documentation:

http://localhost:8000/docs

6. Start Frontend

Navigate to the frontend directory:

cd frontend


Install dependencies:

npm install


Start the development server:

npm run dev


Frontend:

http://localhost:5173

🔒 Security

GlobeTrotter is designed with security and user privacy in mind.

Passwords are never stored as plaintext
JWT is used for authentication
Password reset tokens are temporary
Private trips are accessible only to their owners
Administrative functionality is role-protected
Authentication errors avoid exposing sensitive information
📊 Budget System

GlobeTrotter separates planned costs from actual expenses.

                  TRIP BUDGET
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    PLANNED COSTS             ACTUAL EXPENSES
          │                         │
          └────────────┬────────────┘
                       │
                       ▼
                    VARIANCE


Supported expense categories include:

🚆 Transport
🏨 Accommodation
🎟️ Activities
🍜 Food
📦 Miscellaneous
❤️ Trip Health

Trip Health evaluates whether an itinerary is practical and balanced.

Example:

⚠️ Day 4 is overloaded.

09:00  Temple Visit
11:00  Museum
14:00  City Tour
17:00  Shopping
20:00  Dinner

Recommendation:
Move Shopping → Day 5


The goal is not just to report problems, but to help users fix them.

⚡ Optimization

GlobeTrotter can provide actionable itinerary recommendations such as:

Moving activities to another day
Reducing overloaded schedules
Filling empty days
Resolving scheduling conflicts
Improving budget distribution
🌍 Community & Sharing

Users can publish trips as public Trip Stories.

Other users can:

Explore public trips
View itineraries
Like trips
Comment
Copy trips
Customize copied itineraries

This creates a community-driven travel planning experience.

🚫 MVP Non-Goals

The current MVP does not focus on:

Real-time multi-user collaboration
Native mobile applications
Payment processing
Booking transactions
Machine-learning models
Required third-party maps or booking APIs

The primary goal is a complete web-based travel-planning experience.

🧪 Development Workflow

Create a feature branch:

git checkout -b feature/your-feature


Make your changes:

git add .


Commit:

git commit -m "feat: add your feature"


Push:

git push origin feature/your-feature


Then create a Pull Request.

🤝 Contributing

Contributions are welcome!

When submitting a Pull Request, please include:

What you changed
Why you changed it
How you tested it
Any known limitations
📌 Project Status

🚧 Currently in development

GlobeTrotter is being developed as an Odoo Hackathon project with the goal of creating a complete, intuitive, and intelligent multi-city travel-planning platform.

👨‍💻 Team
GlobeTrotter — Odoo Hackathon

Built with ❤️ for the Odoo Hackathon.

📄 License

License information will be added when the project's licensing decision is finalized.

⭐ Support

If you like this project:

⭐ Star the repository
🍴 Fork the repository
🐛 Report bugs
💡 Suggest improvements
🔧 Submit Pull Requests
🌍 Plan Better. Travel Smarter. Share the Journey.

GlobeTrotter — Your entire trip, one intelligent workspace.
