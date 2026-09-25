# College Discovery Platform

A full-stack college discovery and comparison platform.

## Features

- Study goal → program discovery
- College search and filtering
- Program-specific entrance exam filtering
- College comparison
- Authentication
- Saved colleges

## Repository layout

```
college-discovery-mvp/
│
├── frontend/     Next.js 14 + React + TypeScript UI (see frontend/README.md)
│
├── api/          Next.js API routes + Prisma + PostgreSQL (see api/README.md)
│
├── README.md
└── .gitignore
```

The two apps are independently deployable — `frontend/` has no database of
its own, and `api/` has no UI. Each subproject's own README covers its setup,
environment variables, and implementation details in full; this file is the
60-second overview.

## Architecture

```
Next.js + React + TypeScript   (frontend/)
        ↓  same-origin /api/* rewrite, no CORS
Next.js API Routes             (api/)
        ↓
Prisma ORM
        ↓
PostgreSQL
```

**Deployment topology:**

```
Frontend → Vercel
Backend  → Render/Railway
Database → PostgreSQL/Neon
```

### The core data model

The strongest design decision in this project is the chain that connects a
student's goal to a concrete, filterable admissions requirement:

```
Study Goal
   ↓
Program
   ↓
CollegeProgram
   ↓
CollegeProgramExam
```

A student picks a study goal (e.g. "become a doctor"), which maps to one or
more programs (e.g. MBBS). Each program is offered by a subset of colleges
via `CollegeProgram` — this is the join that carries per-college specifics
like fees and duration. `CollegeProgramExam` then attaches the entrance
exam(s) that specific college+program combination actually accepts, since
the same program can require different exams at different institutions.
This chain is what makes goal-based discovery and exam-based filtering both
possible off the same normalized dataset, instead of two disconnected
features.

## Quickstart

```bash
# 1. Backend
cd api
npm install                 # also runs `prisma generate`
cp .env.example .env        # set DATABASE_URL
createdb college_discovery  # or point DATABASE_URL at any Postgres instance
npm run dev                 # http://localhost:4000

# 2. Frontend (separate terminal)
cd frontend
npm install
cp .env.local.example .env.local   # BACKEND_URL defaults to http://localhost:4000
npm run dev                        # http://localhost:3000
```

See `api/README.md` and `frontend/README.md` for full setup, data seeding,
and deployment instructions.
