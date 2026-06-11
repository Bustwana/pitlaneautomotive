# Pitlane Automotive Group

A subscription-based automotive service management platform. Subscribers pay weekly/annually for scheduled car services, and mechanics are partner workshops who get subscribers assigned to them.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/pitlane run dev` — run the frontend (React + Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, zustand, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema: `lib/db/src/schema/` (mechanics, subscribers, bookings)
- API spec: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/api.ts`
- API routes: `artifacts/api-server/src/routes/`
- Frontend pages: `artifacts/pitlane/src/pages/`
- Auth state: `artifacts/pitlane/src/lib/auth.ts` (zustand)

## Architecture decisions

- Auth is session-based client-side state (zustand) — no JWT or cookies. Admin password defaults to `pitlane2024` and can be set via `ADMIN_PASSWORD` env var.
- Mechanics each have a code (MECH001, MECH002...) + password stored in DB for portal login.
- Dark mode applied by default via `.dark` class on `<html>`. Signup page uses light background override.
- OpenAPI contract-first: all endpoints defined in `lib/api-spec/openapi.yaml` before implementation.
- Mechanic passwords are stored in plain text in DB (acceptable for internal admin tool — upgrade to hashed if going public).

## Product

- **Admin Portal** (`/admin/*`): Dashboard with stats + subscriber/mechanic/booking management. Login: password `pitlane2024`.
- **Mechanic Portal** (`/mechanic/:id`): Per-workshop view of assigned subscribers, upcoming bookings, and revenue share. Login: code (e.g. `MECH001`) + password (e.g. `workshop123`).
- **Subscriber Signup** (`/signup`): Public self-signup form with tier selection (Basic/Standard/Annual).

## Pricing

### Joining Fees (one-off)
- Basic: $130
- Standard: $160
- Annual: No joining fee

### Subscription Costs
- Basic: $7/wk or $299/yr
- Standard: $13/wk or $450/yr
- Annual tier = pay-upfront option at a slight discount (tier-dependent)

### What Subscribers Get
- **Basic**: 1 service/year + mid-year fluid & tyre pressure check
- **Standard**: 2 services/year + mid-year check + bonus inclusions (tyre rotation etc., mechanic-dependent)
- **Annual**: All inclusions of chosen tier, slight discount for paying upfront

### Mechanic Economics
- Pitlane receives 30% service discount from mechanic
- Mechanic receives 10–15% revenue share
- Pitlane keeps 85–90% of subscription revenue

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` after changing `lib/db/src/schema/` before typechecking artifacts.
- After any OpenAPI spec change, run codegen before touching routes or frontend.
- `ADMIN_PASSWORD` env var overrides the default admin password. Default: `pitlane2024`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
