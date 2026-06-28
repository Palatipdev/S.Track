# Project Context — S.Track

> Rolling log of session-level context. Each session appends a new entry under **Session History** so the next session can pick up without re-deriving state. Keep entries short and factual — code itself is the source of truth.

---

## Project Snapshot

- **Repo**: `S.Track` (GitHub: `Palatipdev/S.Track`)
- **Stack**: Next.js `16.2.3` (App Router), React `19.2.4`, Tailwind CSS v4, TypeScript 5; Python FastAPI + SQLAlchemy backend (not yet scaffolded); Supabase (Postgres + Storage + Auth).
- **Important**: This Next.js version has breaking changes vs. older versions. Always consult `frontend/node_modules/next/dist/docs/` before writing Next-specific code (per `AGENTS.md`).
- **Working directory**: `C:\Users\riaza\Documents\s-track`
- **Platform**: Windows 11, PowerShell

## Repo Layout
```
/
├── frontend/   Next.js 16 app (was at repo root before reorg)
├── backend/    FastAPI — placeholder, to be scaffolded
├── docs/       This file + Project-Spec.md, claude-rule.md, learned.md
├── README.md, AGENTS.md, CLAUDE.md, LICENSE
```

## Current State

- Boilerplate `create-next-app` scaffold only, now under `frontend/`. `frontend/app/page.tsx` is the default landing page.
- No backend project initialized yet (FastAPI not scaffolded; `backend/` directory does not exist yet, create on first use).
- No app features, routes, components, API handlers, or tests yet.
- DB schema designed in `sql/database-table.mwb` (MySQL Workbench ERD). Not yet translated to Postgres or applied. Supabase project not yet created.
- Stray `s-track` empty file at root has been removed.

## Conventions & Constraints

- Follow `AGENTS.md`: do not assume legacy Next.js APIs/conventions; verify against `frontend/node_modules/next/dist/docs/`.
- Tailwind v4 (PostCSS plugin via `@tailwindcss/postcss`).
- ESLint via `eslint-config-next` (run from `frontend/`: `npm run lint`).
- Frontend scripts run from `frontend/`: `npm run dev` / `build` / `start` / `lint`.

## Open Questions / TODO Backlog

- [ ] Lock schema in `docs/Project-Spec.md`.
- [ ] Create Supabase project + capture connection details.
- [ ] Scaffold `backend/` with FastAPI + SQLAlchemy + Alembic.
- [ ] Write first migration: `companies`, `users`, `projects`, `project_members`.

---

## Session History

### Session 2026-05-05: Bootstrap context tracking
- Reviewed repo state (fresh Next.js 16 scaffold, no feature code).
- Created this `Project-Context.md` to seed session continuity.
- No code changes.

### Session 2026-05-08: Schema design complete in MySQL Workbench
- **Goal**: Audit the ER diagram in `sql/database-table.mwb` against `docs/Project-Spec.md`. Fix issues that change shape (entities, relationships, PKs); defer cosmetic fixes to the Postgres translation step.
- **Changes**:
  - Surrogate-only PKs on `User`, `Project`, `Supplier`, `MaterialRequest`, `PurchaseOrder`, `Deliverie`, `OrderItems`. `company_id` added to every transactional table as a regular FK column, never in the PK.
  - `User`: email uniqueness moved to a `(companyID, email)` composite UNIQUE; `role` switched to `ENUM('owner','buyer','onsite','factory','engineer')`.
  - `MaterialRequest`: `requestedBy INT` FK to users, `projectID` FK constraint added, `companyID` added, `status` switched to ENUM.
  - `RequestItems` filled in with `itemName VARCHAR(255)`, `quantity INT`, `unit VARCHAR(20)`.
  - `Request_Events`, `Order_Events`, and `Delivery_Events` (currently named `Request_Events_copy1` in the .mwb, pending rename) added as append-only audit logs per spec line 89.
  - `deliveryPhotos` rebuilt with `fileKey VARCHAR(512)`, `sha256Hash CHAR(64)`, `serverUploadedAt DATETIME`, plus `UNIQUE (deliveryID, sha256Hash)` for dedup.
  - `Material_Project_User` removed as redundant with `User_Project` + the request's own `projectID`/`requestedBy` columns.
  - `README.md` updated: `sql/` added to repo layout, Next-session task list rewritten around the Postgres translation.
- **Decisions**:
  - The diagram is a thinking tool, not a migration source. Workbench's forward-engineered SQL is discarded. We will write Postgres DDL by hand from the diagram next session.
  - `companyID` is scoping, not identity. It belongs as an indexed FK column on every transactional table, not in the PK.
  - Renames (`Deliverie → deliveries`, snake_case plural everywhere, `gpsX`/`gpsY → gps_lat/gps_lng`) and type fixes (`DECIMAL(2)` money → `numeric(14,2)`, `TIMESTAMP(10)` and `VARCHAR` timestamps → `timestamptz`) deferred to the Postgres translation. Fix once during translation rather than twice.
  - `DeliveredItems` PK is the natural pair `(deliveryID, orderID)`. `deliveryQuantity` is a measurement, not an identifier.
- **Unfinished**:
  - `PurchaseOrder` still has stray `userID` and `PurchaseOrdercol` columns from accidental Workbench clicks. Same with `DeliveredItems.userID` and `DeliveredItems.DeliveredItemscol`. Delete before the Postgres translation step.
  - `Request_Events_copy1` is the `Delivery_Events` placeholder. Rename the table, change `deliveryID` from `VARCHAR(45)` to `INT`, rename the FK constraint.
- **Next**: Walk through the diagram concept-by-concept and translate to Postgres DDL: types, enums, identity columns, soft-delete, server-stamped timestamps, multi-tenant scoping, RLS policy stubs, append-only event semantics. Produce the first Alembic migration in `backend/` for `companies`, `users`, `projects`, `project_members`.

### Session 2026-06-24: Postgres DDL + Supabase setup
- **Goal**: Translate MySQL Workbench schema to Postgres DDL and apply it to a live Supabase project.
- **Changes**:
  - Created `sql/schema.sql` — full Postgres DDL for all 15 tables: `companies`, `users`, `projects`, `project_members`, `suppliers`, `material_requests`, `request_items`, `purchase_orders`, `order_items`, `deliveries`, `delivery_items`, `delivery_photos`, `request_events`, `order_events`, `delivery_events`.
  - All PKs use `bigint GENERATED ALWAYS AS IDENTITY`. All timestamps `timestamptz`. All money `numeric(14,2)`. ENUMs as named types.
  - Supabase project created (Northeast Asia — Tokyo). Data API off, RLS auto-enable on.
  - Schema applied via Supabase SQL editor — all 15 tables confirmed live.
  - `README.md` task list updated.
- **Decisions**:
  - `bigint` over `integer` for all PKs — SaaS default, avoids 2B row ceiling.
  - `project_members` uses composite PK `(project_id, user_id)` — no surrogate needed.
  - `approved_by` nullable on `material_requests` — requests start as `pending` with no approver yet.
  - Audit log `payload` column is `jsonb` — each event type carries different metadata, JSON avoids a column per field.
  - Data API disabled — FastAPI is the only entry point to the DB.
- **Unfinished**: nothing mid-flight.
- **Next**: scaffold `backend/` with FastAPI + SQLAlchemy + Alembic. Write first Alembic migration matching `sql/schema.sql`. First endpoint: `POST /material-requests`.

### Session 2026-06-26: FastAPI backend scaffold + SQLAlchemy models
- **Goal**: Scaffold the FastAPI backend and write SQLAlchemy models for all 15 tables.
- **Changes**:
  - Created `backend/` with Python venv, FastAPI, SQLAlchemy, Alembic, psycopg2, python-dotenv.
  - `backend/app/database.py`: SQLAlchemy engine + `get_db()` session factory, reads `DATABASE_URL` from `.env`.
  - `backend/app/main.py`: FastAPI app with `GET /health` route.
  - `backend/app/models.py`: all 15 SQLAlchemy models matching `sql/schema.sql`. All 5 enums as Python `enum.Enum` classes.
  - `backend/alembic.ini` + `backend/migrations/`: Alembic initialised, `env.py` wired to read `DATABASE_URL` from `.env`.
  - Alembic stamped at head (schema was already applied manually via SQL editor last session).
  - Supabase connection confirmed working via pooler URL (direct `db.` host had DNS issues on this network).
- **Decisions**:
  - Used pooler connection string (Transaction mode) instead of direct — direct host failed DNS resolution.
  - Stamped Alembic baseline rather than autogenerating a drop migration — models were written after schema was already live.
- **Unfinished**: `.env` not committed (correct — secrets stay local).
- **Next**: First vertical slice — `POST /material-requests` endpoint (Pydantic schema → FastAPI route → DB insert).

### Session 2026-06-27: First vertical slice + auth wiring
- **Goal**: Ship `POST /material-requests` end-to-end and wire Supabase Auth into the backend.
- **Changes**:
  - `backend/app/schemas.py`: Pydantic input models `RequestItemIn` and `MaterialRequest` (accepts nested `items` list).
  - `backend/app/main.py`: `POST /material-requests` — inserts the request header, then loops `body.items` into `request_items`. Pulls `company_id` + `requested_by` from the authenticated user, not the request body.
  - `backend/app/auth.py`: `get_current_user` dependency. Verifies the Supabase JWT via the `supabase` Python client (`supabase.auth.get_user(token)`), then resolves the token's email to a `User` row.
  - Installed `python-jose` (initial attempt) then `supabase` client. `.env` gained `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
  - Created test data: one `companies` row (id 1), one `users` row (id 1, owner), one auth user in Supabase Auth, one `projects` row (id 4).
  - Confirmed working: 200 response, `company_id`/`requested_by` correctly filled from the token.
- **Decisions**:
  - Switched JWT verification from local HS256 decode to the Supabase client. Project uses ES256 asymmetric signing keys, so the shared-secret HS256 path failed. Letting the Supabase client validate avoids managing public keys by hand.
  - Items are accepted nested in the request body (one POST), then split: one `material_requests` row + N `request_items` rows, committed in two phases so `new_request.id` exists before inserting items.
- **Debugging notes (cost ~1h)**:
  - PowerShell `Invoke-RestMethod` word-wraps long output; copying `access_token` from the console pulled in embedded spaces → malformed JWT → "requires a valid Bearer token". Fix: `$r.access_token | Set-Clipboard`.
  - Must run uvicorn and the token command in two separate terminals.
  - `project_id: 0` failed the FK to `projects`; needed a real project row.
- **Unfinished**: `company_id`/`requested_by` proven via auth, but no create-project or create-user endpoints yet (test data inserted by hand). No `GET /material-requests` yet.
- **Next**: `GET /material-requests` (list scoped by `company_id`), or build out project/supplier create endpoints. Frontend not started.

### Session 2026-06-28: Frontend login + dashboard
- **Goal**: Build the Next.js login page and a basic dashboard that fetches real data from the API.
- **Changes**:
  - `frontend/app/page.tsx` — created root page that redirects to `/login`.
  - `frontend/app/login/page.tsx` — login form with email/password, calls `supabase.auth.signInWithPassword`, redirects to `/dashboard` on success.
  - `frontend/app/dashboard/page.tsx` — fetches `GET /material-requests` with the Supabase session token, renders a list of requests.
  - `frontend/lib/supabase.ts` — Supabase JS client for the frontend.
  - `frontend/.env.local` — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - `backend/app/main.py` — added CORS middleware allowing `http://localhost:3000`.
- **Decisions**:
  - Used `supabase.auth.getSession()` on the frontend to get the access token for API calls.
  - `any[]` type for requests state — good enough for now, can be typed properly later.
- **Debugging notes**:
  - Turbopack panicked because `app/page.tsx` was missing. Fix: create it. Also clear `.next` cache with `Remove-Item -Recurse -Force .next` when Turbopack has stale state.
  - CORS blocked API calls from the browser — fixed by adding `CORSMiddleware` to FastAPI.
  - `next/router` is the old Pages Router import. App Router uses `next/navigation`.
- **Unfinished**: Dashboard is a plain list, no styling. Items not shown (separate table). No logout button.
- **Next**: Style the dashboard with Tailwind. Add logout. Start the material request submission form on the frontend.

<!--
Template for the next session:

### Session YYYY-MM-DD — <short title>
- **Goal**: …
- **Changes**: files touched, key commits.
- **Decisions**: any non-obvious choices and why.
- **Unfinished**: what's mid-flight, where to resume.
- **Next**: explicit next step for the following session.
-->
