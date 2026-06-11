# Pitlane Automotive Group — Claude Code Handoff

## What This Is

A full-stack **subscription-based automotive service management platform** with three portals:

- **Landing page** (`/`) — public marketing page with Join Now CTA
- **Subscriber Signup** (`/signup`) — public self-signup form
- **Admin Portal** (`/admin/*`) — dashboard, subscriber/mechanic/booking management
- **Mechanic Portal** (`/mechanic/:id`) — per-workshop view for partner workshops

All subscriber data currently in the database is **placeholder/seed data only** — not real customers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 (strict) |
| Package manager | pnpm workspaces |
| Frontend | React + Vite, Tailwind CSS v4, shadcn/ui, zustand, wouter |
| API | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod (`zod/v4`), `drizzle-zod` |
| API contract | OpenAPI spec → Orval codegen (React Query hooks + Zod schemas) |
| API build | esbuild (CJS bundle) |

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── api-server/          # Express 5 API (@workspace/api-server)
│   │   └── src/
│   │       ├── app.ts       # Express app setup, /api prefix mount
│   │       ├── index.ts     # Server entry (reads PORT env var)
│   │       └── routes/      # health, auth, subscribers, mechanics, bookings, dashboard
│   └── pitlane/             # React + Vite frontend (@workspace/pitlane)
│       └── src/
│           ├── App.tsx       # Router (wouter), QueryClient
│           ├── pages/
│           │   ├── Landing.tsx          # Home page /
│           │   ├── Login.tsx            # Admin + mechanic login /login
│           │   ├── Signup.tsx           # Public signup /signup
│           │   ├── admin/
│           │   │   ├── Dashboard.tsx    # /admin/dashboard
│           │   │   ├── Subscribers.tsx  # /admin/subscribers
│           │   │   ├── Mechanics.tsx    # /admin/mechanics
│           │   │   └── Bookings.tsx     # /admin/bookings
│           │   └── mechanic/
│           │       └── Portal.tsx       # /mechanic/:id
│           ├── components/
│           │   ├── layout/AdminLayout.tsx  # Collapsible sidebar layout
│           │   └── ui/StatCard.tsx         # Stat display card
│           └── lib/
│               └── auth.ts              # Zustand auth store (session-based)
├── lib/
│   ├── api-spec/            # OpenAPI spec (@workspace/api-spec)
│   │   └── openapi.yaml     # CONTRACT — edit this first before routes/frontend
│   ├── api-client-react/    # Generated React Query hooks (@workspace/api-client-react)
│   ├── api-zod/             # Generated Zod schemas (@workspace/api-zod)
│   └── db/                  # Drizzle ORM + schema (@workspace/db)
│       └── src/schema/
│           ├── subscribers.ts
│           ├── mechanics.ts
│           └── bookings.ts
└── scripts/                 # Utility scripts (@workspace/scripts)
```

---

## Environment Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ Yes | — | PostgreSQL connection string |
| `ADMIN_PASSWORD` | No | `pitlane2024` | Currently set to `Violet2024` in this env |
| `SESSION_SECRET` | No | — | Available as Replit secret |
| `PORT` | Injected by workflow | — | Set per artifact via artifact.toml |
| `BASE_PATH` | Injected by workflow | — | `/` for frontend, `/api` for API |

---

## Key Commands

```bash
# Run API server (port 8080, proxied at /api)
pnpm --filter @workspace/api-server run dev

# Run frontend (port 24194, proxied at /)
pnpm --filter @workspace/pitlane run dev

# Push DB schema changes (dev only — runs Drizzle push)
pnpm --filter @workspace/db run push

# After ANY change to openapi.yaml — MUST run before touching routes or frontend
pnpm --filter @workspace/api-spec run codegen

# Full typecheck (libs first, then leaf packages)
pnpm run typecheck

# Typecheck libs only (run after changing lib/db/src/schema/)
pnpm run typecheck:libs

# Typecheck a specific artifact
pnpm --filter @workspace/pitlane run typecheck
pnpm --filter @workspace/api-server run typecheck
```

---

## Database Schema

### `subscribers`
| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `fname` | text NOT NULL | |
| `lname` | text NOT NULL | |
| `phone` | text | |
| `email` | text | |
| `suburb` | text | |
| `make` | text | Vehicle make |
| `model` | text | Vehicle model |
| `year` | text | Vehicle year |
| `tier` | text NOT NULL | `basic` / `standard` / `annual` |
| `mech_id` | integer | FK → mechanics.id (nullable) |
| `next_service` | text | Date string (ISO) |
| `consent` | text NOT NULL | `yes` / `pending` (defaulted pending; set to yes on signup) |
| `join_date` | text NOT NULL | Date string |
| `created_at` | timestamp | |

### `mechanics`
| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `name` | text NOT NULL | Workshop name |
| `contact` | text | Contact person name |
| `phone` | text | |
| `email` | text | |
| `location` | text | |
| `code` | text NOT NULL UNIQUE | e.g. `MECH001` — used for login |
| `discount` | integer NOT NULL | Default 30 (%) — Pitlane discount from mechanic |
| `rev_share` | integer NOT NULL | Default 10 (%) — mechanic's revenue share |
| `password` | text NOT NULL | Plain text (acceptable for internal tool) |
| `created_at` | timestamp | |

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `sub_id` | integer NOT NULL | FK → subscribers.id |
| `mech_id` | integer NOT NULL | FK → mechanics.id |
| `service` | text NOT NULL | Service description |
| `date` | text | ISO date string |
| `value` | real | Retail value of service ($) |
| `status` | text NOT NULL | `pending` / `active` / `completed` |
| `created_at` | timestamp | |

---

## API Endpoints

All routes mounted under `/api`. Uses Express 5.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| POST | `/api/auth/admin-login` | Admin login (body: `{ password }`) |
| POST | `/api/auth/mechanic-login` | Mechanic login (body: `{ code, password }`) |
| GET | `/api/subscribers` | List all subscribers |
| POST | `/api/subscribers` | Create subscriber |
| PATCH | `/api/subscribers/:id` | Update subscriber |
| DELETE | `/api/subscribers/:id` | Delete subscriber |
| GET | `/api/mechanics` | List all mechanics (password stripped) |
| POST | `/api/mechanics` | Create mechanic |
| PATCH | `/api/mechanics/:id` | Update mechanic |
| DELETE | `/api/mechanics/:id` | Delete mechanic |
| GET | `/api/mechanics/:id/stats` | Mechanic portal stats |
| GET | `/api/bookings` | List all bookings |
| POST | `/api/bookings` | Create booking |
| PATCH | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Delete booking |
| GET | `/api/dashboard/stats` | Full dashboard stats |
| POST | `/api/signup` | Public subscriber self-signup |

---

## Auth System

Session-based client-side state using **Zustand** (`lib/auth.ts`). No JWT, no cookies.

- **Admin**: password-only login → `POST /api/auth/admin-login`. Password: `Violet2024` (set via `ADMIN_PASSWORD` env var; default fallback is `pitlane2024`).
- **Mechanic**: code + password → `POST /api/auth/mechanic-login`. Example credentials: `MECH001` / `workshop123`, `MECH002` / `workshop456`, `MECH003` / `workshop789`.
- Protected routes redirect to `/login` if role doesn't match.
- Auth state is in-memory only — refreshing the page logs you out (by design for this stage).

---

## Frontend Routing

| Route | Component | Protection |
|-------|-----------|-----------|
| `/` | `Landing` | Public |
| `/login` | `Login` | Public |
| `/signup` | `Signup` | Public |
| `/admin` | → redirect to `/admin/dashboard` | Admin only |
| `/admin/dashboard` | `Dashboard` | Admin only |
| `/admin/subscribers` | `Subscribers` | Admin only |
| `/admin/mechanics` | `Mechanics` | Admin only |
| `/admin/bookings` | `Bookings` | Admin only |
| `/mechanic/:id` | `Portal` | Mechanic only |

---

## Business Logic / Pricing

### Subscription Tiers
| Tier | Weekly | Annual (pay upfront) | Joining Fee | Services |
|------|--------|---------------------|-------------|----------|
| Basic | $7/wk | $299/yr | $130 | 1 service/yr + mid-year fluid & tyre pressure check |
| Standard | $13/wk | $450/yr | $160 | 2 services/yr + mid-year check + bonus inclusions |
| Annual | — | $299–$450/yr | None | All inclusions of chosen tier |

### Revenue Model
- Pitlane receives **30% service discount** from mechanic
- Mechanic receives **10–15% revenue share**
- Pitlane keeps **85–90%** of subscription revenue
- Dashboard uses **87.5% avg** for net revenue estimation

### Revenue Calculation (dashboard.ts)
```
basic annual  = count × $364   ($7 × 52)
standard annual = count × $676  ($13 × 52)
annual tier   = count × $374.50 (avg of $299 and $450)
gross         = sum of above
pitlane net   = gross × 0.875
weekly run rate = basic×7 + standard×13 + annual×(374.5/52)
```

---

## Code Generation Workflow

**Contract-first**. The OpenAPI spec is the single source of truth.

1. Edit `lib/api-spec/openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. This generates:
   - `lib/api-client-react/src/generated/api.ts` — React Query hooks
   - `lib/api-zod/src/generated/api.ts` — Zod schemas
4. Import generated hooks in frontend, import Zod schemas in API routes for validation

**Never edit generated files directly.**

---

## Key Conventions & Gotchas

1. **Always run `typecheck:libs` after changing `lib/db/src/schema/`** before typechecking artifacts. Missing `@workspace/db` exports = stale lib declarations.
2. **After any OpenAPI spec change, run codegen before touching routes or frontend.** The generated types must stay in sync.
3. **Never use `console.log` in server code.** Use `req.log` in route handlers, `logger` singleton elsewhere (imported from `./lib/logger`).
4. **Dark mode is applied globally** via `.dark` class on `<html>`. The signup page uses a light background override.
5. **Mechanic passwords are plain text** — acceptable for this internal stage, should be hashed before going public.
6. **`pnpm run dev` at workspace root does not work** — each artifact is run individually via workflow or `pnpm --filter`.
7. **Proxy routing**: All traffic routes through a shared proxy. Services handle their full base path (`/api` for API, `/` for frontend). Never hardcode ports in app code — read from `PORT` env var.
8. **Orval naming**: Query key functions double the verb — e.g. `useGetDashboardStats` → `getGetDashboardStatsQueryKey()`.
9. **`zod/v4`** is used (not `zod`) — import path matters.
10. **DB push command**: `pnpm --filter @workspace/db run push` — dev only, uses Drizzle Kit push (not migrate).

---

## Service Alerts Logic

In `artifacts/api-server/src/routes/dashboard.ts`:
- Subscribers with a `nextService` date **≤ 14 days away** (including past dates) are returned as `serviceAlerts`
- `alertStatus`: `"overdue"` (past) or `"upcoming"` (within window)
- `daysUntil`: negative = days overdue, 0 = today, positive = days until
- Sorted most-overdue-first

---

## Outstanding Work (Prioritised)

### Next to build
1. **Subscriber status field** (`active` / `inactive` / `cancelled`) — most important for data integrity as subscriber count grows; currently everyone looks "active" forever
2. **Joining fee collected flag** — boolean per subscriber; one-off $130–$160 fee is tracked nowhere
3. **Mechanic notes** — free-text field per subscriber, visible to their assigned workshop in the mechanic portal

### Lower priority
4. **CSV export** — download subscriber/booking lists from admin
5. **Booking status quick-update** — mark active → completed from the list without opening full edit (status toggle is in the edit dialog but could be faster inline)
6. **Workshop capacity** — max subscriber count per workshop; alert when full
7. **Multi-vehicle support** — a subscriber currently holds one car only
8. **Service history view** — summary of completed bookings per subscriber
9. **Payment/billing status** — track whether subscribers are paid up or in arrears
10. **Churn tracking** — cancellation dates, reason, report

---

## Proxy & Service Routing

```
User → shared proxy (localhost:80)
  /api/* → API server (internal port 8080)
  /*     → Vite frontend (internal port 24194)
```

When curling from shell, always use `localhost:80/api/...`, never direct port.

---

## Seed Data

All current data is placeholder only. Example mechanic credentials:
- `MECH001` / `workshop123` — Pete's Auto Service
- `MECH002` / `workshop456` — Richmond Auto Works  
- `MECH003` / `workshop789` — (third workshop)

Admin password: `Violet2024`
