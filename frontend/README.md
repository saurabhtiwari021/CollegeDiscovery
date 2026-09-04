# College Discovery MVP — Frontend

The frontend half of the College Discovery MVP, built with **Next.js 14
(App Router) + React 18 + TypeScript + Tailwind CSS**.

This app has **no database of its own**. Every piece of data — colleges,
goals/programs/exams, auth, saved colleges — is served by the sibling
`college-discovery-mvp-api` project (Postgres + Prisma). This app talks to
it two ways:

- **Client components** call relative `/api/...` paths (`src/lib/api-client.ts`).
  A Next.js rewrite in `next.config.mjs` proxies those to `BACKEND_URL` server-side.
  `BACKEND_URL` is read once, from the environment, when the Next.js server
  starts (it's config, not a per-request lookup), so the browser only ever
  sees this app's own origin — no CORS, and auth cookies set by the backend
  land on this app's domain transparently.
- **Server components** (pages doing SSR/data-fetching) call the backend
  directly via `src/lib/server-api.ts`, since the rewrite only intercepts
  real inbound HTTP requests, not `fetch()` calls made during rendering.

Auth is real: `AuthContext` calls the backend's `/api/auth/*` routes, which
set an httpOnly session cookie — there's no mocked/`localStorage` auth here.
Compare selection and saved-colleges state are handled the same way, backed
by `CompareContext`/`SavedContext`.

## Getting started

You need the backend running first (see its own README for DB setup):

```bash
# in college-discovery-mvp-api/
npm install && npm run db:reset-and-seed && npm run dev   # http://localhost:4000
```

Then, in this project:

```bash
npm install
cp .env.local.example .env.local   # BACKEND_URL defaults to http://localhost:4000
npm run dev                        # http://localhost:3000
```

```bash
npm run build && npm run start   # production build
npm run typecheck                # tsc --noEmit
```

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `BACKEND_URL` | Yes (in production) | Base URL of the deployed `college-discovery-mvp-api` instance, e.g. `https://api.example.com`. Used server-side only — never exposed to the browser. Defaults to `http://localhost:4000` for local dev. |

## Deploying

This app is a plain Next.js app — **Vercel** is the simplest target, though
any Node host that runs `npm install && npm run build && npm start` works.

1. Deploy `college-discovery-mvp-api` first (see its README) and note its
   public URL.
2. Deploy this app, setting `BACKEND_URL` to that URL as an environment
   variable on the host.
3. That's it — no database, no other secrets. The `rewrites()` proxy in
   `next.config.mjs` is configured from `BACKEND_URL` when the server starts,
   so it works the same on Vercel as it does locally — just set the env var
   on whichever host you're deploying to.

One thing to double check if the two apps end up on different top-level
domains: the backend's session cookie is `sameSite: "lax"`, which is fine
for the proxied setup here (the browser only ever talks to this app's
origin), but would need revisiting if you ever have the browser call the
backend's origin directly instead.

## Folder structure

```
src/
  app/                  # pages (App Router) — discover, colleges/[slug], compare, saved, login, signup
  components/           # ui/, layout/, discovery/, colleges/, filters/, compare/
  context/              # AuthContext, CompareContext, SavedContext (client state, backed by the API)
  lib/                  # types, formatters, client-side validation, api-client (relative paths), server-api (direct backend calls)
```

## Known tradeoffs (frontend scope)

- Filters that are conceptually multi-select in the roadmap (institution
  type, ownership) are implemented as checkboxes client-side and sent as a
  comma-separated multi-select query param — the backend resolves them via a
  single Prisma query, not per-value round trips.
- Search-relevance ranking is whatever the backend's `?q=` substring/alias
  matching returns — no client-side re-ranking.
- There's no admin/data-import UI; the dataset is managed entirely on the
  backend side (`data/seed/v3/` + the seed scripts).
