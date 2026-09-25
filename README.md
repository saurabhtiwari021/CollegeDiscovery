# College Discovery Platform

A full-stack college discovery and comparison platform designed to help students find colleges through **study goals, programs, entrance exams, fees, placements, rankings, and other admissions information**.

The platform connects a student's broad study goal to specific programs and then to the colleges that actually offer those programs.

---

## Screenshots

### Discover Colleges

![College Discovery Home](screenshots/home.png)

### College Search & Filtering

![College Search](screenshots/college-list.png)

### Study Goal Discovery

![Study Goals](screenshots/study-goals.png)

### College Details

![College Details](screenshots/college-details.png)

---

## Features

- Study goal → program discovery
- Search colleges by name
- Filter colleges by state and institution type
- Program-specific entrance examination filtering
- College comparison
- Save/favorite colleges
- Authentication
- Detailed college profiles
- Program information
- Fees and placement information
- NIRF ranking information
- Normalized college-program-exam data model
- PostgreSQL database with Prisma ORM
- Seeded dataset containing **1,203 colleges**
- Data validation and quality-reporting scripts

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js API routes
- TypeScript
- Prisma ORM
- PostgreSQL

### Database / Infrastructure

- PostgreSQL
- Prisma
- Neon / local PostgreSQL
- Vercel
- Render / Railway

---

## Architecture

```text
┌─────────────────────────────────────┐
│          Next.js Frontend           │
│       React + TypeScript            │
│                                     │
│        localhost:3000               │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│           API Backend               │
│      Next.js API Routes             │
│                                     │
│        localhost:4000               │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│             Prisma                  │
│              ORM                    │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          PostgreSQL                 │
│        College Discovery DB         │
└─────────────────────────────────────┘
```

The frontend and backend are maintained as separate applications. The frontend has no database of its own, while the backend handles database access and API functionality.

---

## Core Data Model

The central design of the platform is the relationship between a student's goal, a program, a college, and the entrance examination accepted for that specific program.

```text
Study Goal
    │
    ▼
Program
    │
    ▼
CollegeProgram
    │
    ▼
CollegeProgramExam
```

For example:

```text
Study Goal
    ↓
Engineering
    ↓
B.Tech
    ↓
College + B.Tech
    ↓
Accepted entrance examination
```

This normalized structure allows the application to support both **goal-based discovery** and **exam-based filtering** without maintaining disconnected datasets.

---

## Dataset

The current MVP contains:

| Metric | Count |
|---|---:|
| Colleges | 1,203 |
| Programs | 54 |
| Study Goals | 12 |
| States Covered | 42 |

The dataset is stored under:

```text
api/data/seed/
```

The project also contains validation and data-quality scripts to help identify invalid or incomplete records before seeding the database.

---

## Repository Structure

```text
college-discovery-mvp/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── api/
│   ├── src/
│   ├── prisma/
│   ├── scripts/
│   ├── data/
│   ├── package.json
│   └── README.md
│
├── screenshots/
│   ├── home.png
│   ├── college-list.png
│   ├── study-goals.png
│   └── college-details.png
│
├── README.md
└── .gitignore
```

---

## Quick Start

### Prerequisites

Make sure you have:

- Node.js 20+
- npm
- PostgreSQL
- Git

---

## 1. Backend

Open a terminal:

```bash
cd api
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
copy .env.example .env
```

Configure your PostgreSQL connection:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/college_discovery"
```

Generate Prisma Client:

```bash
npm run db:generate
```

Apply migrations:

```bash
npx prisma migrate deploy
```

Seed the database:

```bash
npm run db:reset-and-seed
```

Start the backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:4000
```

---

## 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create the environment file:

```bash
cp .env.local.example .env.local
```

On Windows PowerShell:

```powershell
copy .env.local.example .env.local
```

Set:

```env
BACKEND_URL=http://localhost:4000
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## Environment Variables

### Backend

`api/.env`

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/college_discovery"
AUTH_SECRET="your-secret"
```

### Frontend

`frontend/.env.local`

```env
BACKEND_URL="http://localhost:4000"
```

**Never commit real `.env` or `.env.local` files to GitHub.**

---

## Data Validation

The backend includes scripts for validating and reporting on the seeded dataset.

Examples:

```bash
npm run validate-dataset
```

and:

```bash
npm run report-data-quality
```

These help detect malformed records and data-quality issues before the data is used by the application.

---

## Deployment

The application can be deployed as separate services:

```text
Frontend
   │
   └── Vercel

Backend
   │
   └── Render / Railway

Database
   │
   └── PostgreSQL / Neon
```

The frontend requires the deployed backend URL through `BACKEND_URL`.

The backend requires a PostgreSQL `DATABASE_URL`.

---

## Future Improvements

Planned improvements include:

- More verified college and program data
- College recommendation engine
- Personalized admission probability estimation
- Advanced comparison metrics
- Better placement analytics
- Scholarship discovery
- Cutoff history
- More entrance examinations
- User-specific recommendations
- AI-assisted college discovery
- Improved data sourcing and verification
- Production-grade authentication and authorization

---

## Project Status

**Current stage:** MVP / active development

The core discovery, filtering, college details, comparison, saved-college, authentication, and database workflows are implemented. The next phase focuses on improving data coverage, verification, recommendation capabilities, and production deployment.

---

## License

This project is currently intended for educational and development purposes.
