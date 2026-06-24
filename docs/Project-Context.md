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

<!--
Template for the next session:

### Session YYYY-MM-DD — <short title>
- **Goal**: …
- **Changes**: files touched, key commits.
- **Decisions**: any non-obvious choices and why.
- **Unfinished**: what's mid-flight, where to resume.
- **Next**: explicit next step for the following session.
-->
