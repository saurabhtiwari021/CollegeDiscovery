# College Discovery MVP — API

This is the database + seed pipeline + API layer for the College Discovery MVP
(Phases 0–3 of the implementation roadmap). A separate frontend
(`college-discovery-frontend`) now consumes this API — see that project's
README for the discovery UI, college detail/compare pages, and saved-colleges UI.

Stack: Next.js (API Routes) · TypeScript · PostgreSQL · Prisma ORM · TailwindCSS
(installed, unused until a UI is built) · Zod for validation.

## 1. Setup

```bash
npm install
cp .env.example .env        # edit DATABASE_URL if needed
createdb college_discovery  # or use any Postgres instance

npm run db:generate         # generate the Prisma Client
npx prisma migrate deploy   # apply prisma/migrations/20260904000000_init
npm run db:reset-and-seed   # validate CSVs -> seed -> QA report
npm run dev                 # http://localhost:4000  (the frontend proxy expects 4000)
```

`npm run db:reset-and-seed` runs three steps that can also be run individually:

| Script | What it does |
|---|---|
| `npm run data:validate` | Validates every CSV in `data/seed/v3/` — headers, required ids, FK integrity, duplicate keys. Never touches the DB. |
| `npm run db:seed` | Loads the CSVs into Postgres in dependency order (dimensions → colleges → goal/program links → college/program links → exams → placements/details/reviews). Safe to re-run — uses `skipDuplicates`. |
| `npm run data:qa` | Post-seed invariant checks: no duplicate active mappings, no orphaned exam rows, every study goal has ≥1 eligible college, and the NATA/Engineering exam-isolation check called out in the roadmap. Exits non-zero on a critical failure. |

To rebuild from scratch: `dropdb college_discovery && createdb college_discovery && npx prisma migrate deploy && npm run db:reset-and-seed`.

## 2. Verified against the real dataset

This wasn't just written to spec — it was seeded and exercised against the
full V3 dataset (1,203 colleges) before packaging:

- All 16 CSVs validate with zero errors; the full seed loads every row
  (3,570 college-program mappings, 4,283 cities, etc.)
- `npm run data:qa` passes, including the exam-isolation invariant
- `GET /api/goals` returns **Management → 107 eligible colleges**, an exact
  match to the roadmap's own worked example (section 19) — a strong signal
  the goal → program → college eligibility chain is correct
- `GET /api/colleges?goal=engineering&program=btech&exam=jee-main` correctly
  scopes to the exact college+program+exam mapping (49 results); a
  `program=barch&exam=nata` query correctly returns 0 (the dataset simply has
  no verified NATA acceptance rows — see "Known data limitations" below, not
  a bug)
- The full auth → save → list → unsave lifecycle, and every documented error
  code (400/401/404/409), were hit directly with `curl` and returned the
  expected shape
- `npx tsc --noEmit` and `npm run build` both pass clean

## 3. API surface

Every response follows the standard envelope from the roadmap (section 11):

```jsonc
{ "data": [...], "pagination": { "page": 1, "limit": 20, "total": 501, "totalPages": 26 }, "filters": { "applied": {...}, "available": {...} } }
// or, on error:
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fieldErrors": {...} } }
```

| Endpoint | Notes |
|---|---|
| `GET /api/goals` | Study-goal cards. `eligibleCollegeCount` is computed live, never hardcoded. |
| `GET /api/goals/[slug]/programs` | Programs under one goal, with per-program eligible counts. |
| `GET /api/programs/[slug]/exams` | Exam options for a program, verified through actual `college_program_exams` acceptance (not just the default vocabulary). |
| `GET /api/colleges` | Search/filter/pagination — see below. |
| `GET /api/colleges/[slug]` | Full detail contract (section 16): college, detail, programs, placements, reviews, actions. |
| `GET /api/colleges/[slug]/programs` | Programs offered by one college. |
| `GET /api/colleges/[slug]/reviews` | Demo review feed. |
| `GET /api/exams` | Exam catalog, optional `?program=` / `?state=` filters. |
| `GET\|POST /api/compare` | 2–3 college ids (`?ids=1,2,3` or `{ collegeIds: [...] }`) → normalized comparison rows. |
| `GET\|POST\|DELETE /api/saved-colleges` | Requires a session cookie (see Auth below). |
| `POST /api/auth/signup`, `/login`, `/logout`, `GET /api/auth/me` | Minimal cookie-session auth. |

### `GET /api/colleges` query params

`q, goal, program, exam, state, city, institutionType, ownership, minFees, maxFees, minRating, minPlacement, sort, page, limit`

`goal`/`program`/`exam` accept a slug (e.g. `engineering`, `btech`, `jee-main`)
or a numeric id. `state`/`city`/`institutionType`/`ownership` accept a slug,
name, or numeric id.

**Filtering logic (roadmap section 9, implemented in `src/lib/eligibility.ts`):**
goal, program, and exam constraints are all resolved against the **same**
`CollegeProgram` row via a single Prisma `some`, so an exam can never leak
across an unrelated program — the exact invariant the roadmap calls out
(NATA must not surface Engineering colleges just because B.Arch also exists).
A slug that doesn't resolve to a real row returns zero results, not an
ignored filter or a 500.

## 4. What's deliberately simple (MVP scope, not oversights)

- **Search** (`?q=`) is substring matching on `normalized_name` /
  `search_name` / college aliases, with results tie-broken alphabetically.
  The roadmap explicitly says not to build a search engine before the core
  filters work (section 20) — Postgres full-text/trigram search is a
  documented later enhancement, not done here.
- **`filters.available`** in the `/api/colleges` response lists all
  states/institution types/ownership types, not per-query facet counts
  (which would need a second aggregate query per filter dimension). Fine for
  1,203 colleges; worth revisiting if the catalog grows.
- **Auth** is a minimal email+password + httpOnly cookie session, built
  directly on the `User`/`Session`/`Account` tables — which are already
  shaped to match Auth.js's Prisma adapter, so swapping in real Auth.js later
  (OAuth providers, etc.) is a config change, not a schema migration.
- **Pagination** is offset-based (`page`/`limit`, capped at 50), per the
  roadmap's explicit guidance that this is fine for ~1,200 rows (section 21).

## 5. Known data limitations (V3 dataset itself, not the API)

- `college_program_exams` has only 190 rows covering 9 exam types
  (GATE, JEE Main/Advanced, CAT, NEET-UG, CLAT, BITSAT, UCEED, NLSAT-LLB).
  Most program+exam combinations — including every NATA row — have no
  *verified* college-level acceptance record yet, so exam-filtered queries
  for those will correctly return zero results until more data is verified.
  `GET /api/programs/[slug]/exams` exposes `collegesAcceptingCount` per exam
  so this is visible rather than silent.
- 1,053 of 1,203 colleges have no `college_details` row and no demo reviews —
  `GET /api/colleges/[slug]` returns `null`/`[]` for those fields rather than
  fabricating content, per the roadmap's "Not available, not 0/invented"
  rule.

## 6. Project layout

```
prisma/schema.prisma        canonical data model (22 tables)
prisma/migrations/          hand-verified init migration (applied + tested)
prisma/seed.ts              seed pipeline entrypoint
scripts/validate-dataset.ts pre-seed CSV validation
scripts/report-data-quality.ts  post-seed invariant checks
scripts/csv-utils.ts        shared CSV parsing/type-coercion helpers
data/seed/v3/               the V3 CSV package (source of truth)
src/lib/                    prisma client, validation, pagination, eligibility, filters, search, auth
src/server/queries/         all DB query logic (route handlers stay thin)
src/app/api/                route handlers
```

## 7. Deploying

This is a standard Next.js app talking to Postgres via `@prisma/adapter-pg`
(no Rust query-engine binary, so there's nothing platform-specific to
compile). Recommended target: **Render or Railway** — a long-lived Node
process, not a serverless/edge one. The Prisma client is cached on
`globalThis` (`src/lib/prisma.ts`) so a warm process reuses one connection
pool; that pattern doesn't hold on serverless platforms (Vercel functions,
etc.), where each cold invocation can open its own pool and exhaust Postgres'
connection limit under load. If you do deploy this behind something
serverless, point `DATABASE_URL` at a pooled connection string (Neon's
pooled endpoint, Supabase's pgbouncer port, or your own PgBouncer) rather
than a direct one.

**Steps (Render/Railway, or any host that runs `npm install && npm run
build && npm start`):**

1. Provision a Postgres instance (Render/Railway both offer one; Neon and
   Supabase work too) and copy its connection string.
2. Set environment variables on the host: `DATABASE_URL` (from step 1),
   `AUTH_SECRET` (any random string), `NODE_ENV=production`.
3. `npm install` — this also runs `prisma generate` via the `postinstall`
   script, so the generated client always matches `prisma/schema.prisma`
   rather than relying on a committed copy.
4. Apply the schema and seed the data once (run these as a one-off job/shell
   on the host, or from your machine against the same `DATABASE_URL`):
   ```bash
   npx prisma migrate deploy
   npm run db:reset-and-seed
   ```
5. `npm run build && npm run start`. The app listens on `$PORT` if the host
   sets it (Next.js respects it automatically) — no config needed.
6. Point the host's health check at `GET /api/health` — it runs `SELECT 1`
   against the DB, so it only reports healthy once Postgres is actually
   reachable, not just once the Node process is up.

No CORS setup is needed for the intended topology (the frontend's own
Next.js server proxies `/api/*` to this backend — see the frontend README),
so the browser only ever talks to the frontend's origin. If you call this
API directly from a separate origin (a mobile app, a different frontend),
you'll need to add CORS headers yourself; there's none configured today.

## 8. Next steps (not built here)

Hardening/tests and deployment. Discovery UI, college detail/compare pages,
and saved-colleges UI are built in the separate `college-discovery-frontend`
project against the API above, without changes to this backend.
