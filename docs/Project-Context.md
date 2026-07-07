# Project Context — S.Track

> Rolling log of session-level context. Each session appends a new entry under **Session History** so the next session can pick up without re-deriving state. Keep entries short and factual — code itself is the source of truth.

---

## Project Snapshot

- **Repo**: `S.Track` (GitHub: `Palatipdev/S.Track`)
- **Stack**: Next.js `16.2.3` (App Router), React `19.2.4`, Tailwind CSS v4, TypeScript 5; Python FastAPI + SQLAlchemy backend (scaffolded, ~12 endpoints live); Supabase (Postgres + Storage + Auth).
- **Important**: This Next.js version has breaking changes vs. older versions. Always consult `frontend/node_modules/next/dist/docs/` before writing Next-specific code (per `AGENTS.md`).
- **Working directory**: `C:\Users\riaza\Documents\s-track`
- **Platform**: Windows 11, PowerShell

## Repo Layout
```
/
├── frontend/   Next.js 16 app (login + dashboard)
├── backend/    FastAPI + SQLAlchemy (models, schemas, auth, ~12 endpoints)
├── sql/        schema.sql (Postgres DDL) + MySQL Workbench ERD
├── docs/       This file + Project-Spec.md, claude-rule.md, learned.md
├── README.md, AGENTS.md, CLAUDE.md, LICENSE
```

## Current State

- **DB**: Postgres schema (`sql/schema.sql`, 15 tables, 5 enums) live on Supabase. Data API off; FastAPI is the only DB entry point.
- **Backend** (`backend/app/`): FastAPI scaffolded with SQLAlchemy models (all 15 tables), Pydantic schemas, and Supabase-JWT auth (`get_current_user`). Endpoints live:
  - `GET /health`
  - `POST /material-requests`, `GET /material-requests`, `PATCH /material-requests/{id}` (owner-only approve/reject), `GET /material-requests/{id}/items`
  - `POST /purchase-orders`, `GET /purchase-orders` (with per-item variance), `GET /purchase-orders/{id}/items`
  - `POST /deliveries`, `POST /deliveries/{id}/photos` (multipart upload, server-side sha256, Supabase Storage bucket `delivery-photos`)
  - `POST /projects`, `GET /projects`, `POST /suppliers`, `GET /suppliers`
- **Frontend** (`frontend/app/`): login page (Supabase Auth), Tailwind-styled dashboard (header w/ sign-out, action toolbar, sectioned cards, centered modal overlays) listing requests by status (pending/approved/rejected) with expand-to-items, approve/reject buttons, add-request modal, an add-purchase-order modal (approved-request picker → items load → supplier/date/unit-cost → POST), a purchase-orders list with per-item variance highlighting, a delivery-confirmation modal (order-picker dropdown, fetch-on-select, per-item received-qty inputs), and a delivery-photo upload block (file input, camera/gallery capture, `FormData` POST) gated on a confirmed delivery id.
- **Auth**: test company (id 1), test owner user (id 1), test project — inserted by hand / via endpoints. No create-user endpoint yet.
- Dashboard styled with Tailwind (dark theme, cards, modal overlays). Login page still unstyled.

## Conventions & Constraints

- Follow `AGENTS.md`: do not assume legacy Next.js APIs/conventions; verify against `frontend/node_modules/next/dist/docs/`.
- Tailwind v4 (PostCSS plugin via `@tailwindcss/postcss`).
- ESLint via `eslint-config-next` (run from `frontend/`: `npm run lint`).
- Frontend scripts run from `frontend/`: `npm run dev` / `build` / `start` / `lint`.

## Open Questions / TODO Backlog

**PIVOT (2026-07-03): real requirements from the family company's manager. Read `Project-Spec-v2.md` first.** v1 request→approval→PO flow is demoted; new core is PO ingest → goods receipt w/ condition checklist → multi-location stock → withdrawal (เบิก) tracking.

**Phase A: CORE DONE (2026-07-06/07).** Backend and frontend both wired end-to-end across all 8 v2 pages (dashboard/PO list, PO detail, receive, stock, withdraw, items, locations, shared layout shell). See README.md "v2 Pivot — Phase A" section for the full done-list.

**Demo with the aunt/manager is in 2 days from 2026-07-07 (i.e. ~2026-07-09).** User is ahead of schedule. Plan for the remaining time, decided with the user this session:

1. **Today/next (2026-07-07, in progress)**: finish end-to-end test pass with real Thai test data (see "Test Data Walkthrough" below), fix bugs as found.
2. **Architecture grilling day (not yet done — do this next)**: per `docs/claude-rule.md` Rule 9 (added this session), dedicate a full session to grilling the user on the codebase like an interviewer — data model why's, request-flow tracing (PO ingest → receive → stock update → withdraw), enum/stock_movements/stock_levels reasoning — pulling answers from actual code, not memory. User explicitly asked for this before the demo so they can defend the project confidently in interviews and to the aunt.
3. **Frontend visual/design pass**: user says current UI is functional but "templated/AI-like." User is gathering reference designs (sent some dashboard inspiration images this session — sidebar SaaS dashboards, stat-tile rows, financial dashboards) to redo styling. Do this AFTER the grilling session, with a full day of runway before the demo, not instead of it.
4. **After grilling + redesign**: user wants to post on LinkedIn about Phase A completion + the upcoming manager meeting, to keep recruiter visibility up during internship applications.

- [ ] Get the manager's ER diagram; diff against `Project-Spec-v2.md` entities; record decisions in its Decision Log.
- [ ] Unit-consistency question still unanswered by manager (blocks whether `items.base_unit` needs to move to per-transaction).
- [ ] Wire receipt photo upload into the receive form (needs `receipt.id` from POST response before calling the photo endpoint).
- [ ] `location_members` assignment UI — deferred to a self-service "join your location" flow (worker/unit-leader picks their own location), not an admin picker. Reasoning: some unit leaders are low-tech / may not have app access yet; forcing admin-side assignment now creates friction for no benefit before the core flow is proven.
- [ ] Visual/design pass on frontend — see plan above.
- [ ] Create-user endpoint (test users still inserted by hand).
- [ ] RLS policy stubs scoped by `company_id`.
- Retired by pivot: budget auto-deduct, requested-vs-ordered budget overview (budget lives in the ERP).

## Test Data Walkthrough (in progress 2026-07-07)

Real test pass using Thai test data end-to-end, in this order (later steps depend on earlier ones existing):

1. **`/dashboard/locations`**: Central (`สโตร์กลาง`, type `central`, no parent) → Unit (`หน่วยกรุงเทพ`, type `unit`, parent = central) → Project site (`โครงการ BR69011`, type `project_site`, parent = unit, project = a seeded `Project` row, e.g. "Sala Bodhgaya" id 2 already exists in DB).
2. **`/dashboard/items`**: ไม้สัก 150cm (category ก่อสร้าง, spec `2 1/2" x 7" x 150cm`, unit ตัว), ปูนซีเมนต์ (category ก่อสร้าง, spec blank/null, unit ถุง).
3. **`/dashboard` Add PO**: PO Number `SC10-6907-0008`, supplier (seed via Swagger if needed, e.g. ไทยวัสดุก่อสร้าง), project = โครงการ BR69011, 2 lines at หน่วยกรุงเทพ (ไม้สัก qty 8 price 450, ปูนซีเมนต์ qty 20 price 150).
4. **Receive against the PO**: ไม้สัก received 8 / accepted 7 / rejected 1 / condition damaged / return_to_supplier checked; ปูนซีเมนต์ received 20 / accepted 20 / rejected 0 / good. Expected PO status after: `partially_received` (one line short of full accepted qty).
5. **`/dashboard/stock`**: select หน่วยกรุงเทพ, expect ไม้สัก qty 7, ปูนซีเมนต์ qty 20.
6. **`/dashboard/withdraw`**: withdraw 5 ปูนซีเมนต์ from หน่วยกรุงเทพ against โครงการ BR69011 → stock should drop to 15. Also test over-withdrawing (e.g. qty 999) — should show amber warning but still allow submit (deliberate no-block design decision).

**Bugs found and fixed during this pass** (all committed):
- `Items.company_id` FK, `Items.is_active` Boolean, `POItem.id`/`item_id` type fixes — earlier session.
- `PurchaseOrderIn` had stale `material_request_id`/`status` fields — removed.
- `OrderStatus` enum reverted to old `pending/delivered/cancelled` values via an apparent editor/undo glitch — re-fixed to `open/partially_received/received/closed/cancelled` (model + migration `da22d5d6d67c`), confirmed correct in Supabase.
- `DeliveryPhoto.id` had a `mappped_column` typo (extra `p`) — fixed.
- `main.py /items` POST used `unit=` instead of the model's actual field name `base_unit=` — fixed (root cause of a 500 on item creation).
- Added `po_number` column to `purchase_orders` (model + schema + endpoint + migration `481c2a16e72d`).
- `ItemIn.spec` was `str` (required) but cement legitimately has no spec — changed to `Optional[str] = None` in schema AND `nullable=True` in the `Items.spec` model column (migration `c4db68a2c257`) — both layers needed to agree, schema-only fix wasn't enough (DB NOT NULL constraint still rejected it).
- Double-POST-firing bug: clicking "Add"/submit buttons twice fired two requests. Fixed with a new shared hook `frontend/lib/useSubmitGuard.ts` (`{ isSubmitting, guard }`) wired into all 5 POST forms (Add PO, Add Item, Add Location, Receive, Withdraw) — button disables + shows "..." label while a request is in flight.
- Still open at time of writing: `locations.map is not a function` crash on `/dashboard/stock` — `setLocations(await locRes.json())` sets whatever the response body is without checking `res.ok`; if `/storage_location` errors, an object (not array) lands in state. Not yet root-caused — check the Network tab response for that specific request when resuming.

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

### Session 2026-06-29: Frontend request submission + approval endpoint
- **Goal**: Let the frontend submit material requests, and give the owner an approve/reject action.
- **Changes**:
  - `frontend/app/dashboard/page.tsx` — add-request modal: project_id / urgency / reason inputs plus a nested item builder (`addItem`), POSTs the whole payload to `POST /material-requests`.
  - `backend/app/main.py` — `PATCH /material-requests/{request_id}` to set status; owner-only, scoped by `company_id`. Added `ApproveRequest` Pydantic schema.
  - `backend/app/main.py` — `GET /material-requests/{request_id}/items`; frontend expand-on-click shows a request's line items (`toggleExpand` + `itemsMap`).
  - Logout button added to the dashboard.
- **Decisions**:
  - First PATCH endpoint — assigned to the user as a solo learning task (per claude-rule §0).
  - Items posted nested in one request body, same pattern as the POST insert.
- **Next**: purchase-order logging (buyer logs PO after approval).

### Session 2026-06-30: Purchase orders + variance + status split (caught a design flaw)
- **Goal**: Buyer logs a purchase order against an approved request; owner sees requested-vs-ordered variance.
- **Changes**:
  - `backend/app/main.py` — `POST /purchase-orders` (header + order_items, `total_cost` summed server-side, rejects non-`approved` requests), `GET /purchase-orders` (per-item variance %, `flagged` when any item >10%), `POST /deliveries` (header + delivery_items). Added `PurchaseOrderIn` / `OrderItemIn` / `DeliveryIn` schemas.
  - `frontend/app/dashboard/page.tsx` — requests split into pending/approved/rejected sections; purchase-orders list renders nested per-item variance with red highlight over 10%.
- **Decisions**:
  - **Design flaw caught**: variance was going to match request vs order by *item name*, which breaks on naming variations. Changed `order_items` to carry `request_item_id` (FK) so variance ties to the exact requested line. Updated schema, model, and Pydantic to match.
  - `total_cost` computed on the server from `quantity * unit_cost`, never trusted from the client.
- **Next**: project/supplier create endpoints; wire delivery confirmation to the frontend.

### Session 2026-07-01: Project/supplier CRUD + delivery confirmation
- **Goal**: Add project/supplier endpoints; ship the delivery-confirmation flow end-to-end.
- **Changes**:
  - `backend/app/main.py` — `POST/GET /projects`, `POST/GET /suppliers`, all `company_id`-scoped. Added `ProjectIn` / `SupplierIn` schemas.
  - `backend/app/main.py` — `GET /purchase-orders/{order_id}/items` to feed the delivery modal.
  - `frontend/app/dashboard/page.tsx` — delivery modal: order-picker `<select>` (`onChange` → `fetchOrderItems`), per-item `received_qty` inputs keyed by `order_item.id` (`Record<number, number>` state), `handleDelivery` builds the `items` array and POSTs to `/deliveries` with `purchase_order_id`, `gps_lat`, `gps_lng`, `items`. GPS captured on mount via `navigator.geolocation`.
- **Decisions**:
  - Delivery form's `onSubmit` explicitly calls `e.preventDefault()` before `handleDelivery()` — guards against the browser's default full-page-reload submit behavior.
  - `received_qty` state keyed by `order_item.id` (dict/map shape), not a single value — mirrors `itemsMap`'s existing per-id lookup pattern, needed because the number of order items is dynamic per order.
- **Debugging notes**: first draft of `handleDelivery` skipped `Content-Type: application/json` and never added the built `items` array into the POST body — both silent no-ops until traced through manually.
- **Next**: delivery photo upload pipeline (Supabase Storage → server-side sha256 → `delivery_photos`); budget auto-deduct on purchase-order logging.

### Session 2026-07-02: Delivery photos, Add Purchase Order UI, Tailwind styling
- **Goal**: Ship delivery-photo upload end-to-end; close the "no Add Purchase Order UI" gap; style the dashboard.
- **Changes**:
  - `backend/app/main.py` — `POST /deliveries/{delivery_id}/photos`: takes `file: UploadFile`, reads bytes, hashes with `hashlib.sha256`, uploads to the Supabase Storage bucket `delivery-photos` via `supabase.storage.from_(...).upload(...)`, inserts a `DeliveryPhoto` row (`delivery_id`, `file_key`, `sha256_hash`). Guarded by delivery ownership (`company_id` match). Required `python-multipart` install for FastAPI's multipart parsing.
  - `frontend/app/dashboard/page.tsx` — file input (`accept="image/*" capture="environment"`) + `uploadPicture`, POSTs a `FormData` body (no `Content-Type` header, no `JSON.stringify` — browser sets the multipart boundary). Gated behind `confirmDeliveryId`, captured from `handleDelivery`'s response after a successful delivery POST.
  - `frontend/app/dashboard/page.tsx` — **Add Purchase Order modal** (new, Claude-written per claude-rule §0 — repeat of the add-request modal pattern): picks an approved request → `fetchRequestItems` loads its line items → supplier dropdown + expected-delivery date + per-item unit-cost inputs → `handleAddOrder` POSTs to `/purchase-orders`. Added `fetchSuppliers`.
  - Fixed a real bug: the delivery order-picker `<select>` had only one `<option>` in test data, so the browser's default-selected state meant `onChange` never fired on first pick. Fixed by adding a placeholder `<option value="">-- select --</option>` in both the delivery and purchase-order pickers.
  - Full Tailwind pass on the dashboard: sticky header with sign-out pinned top-right (was previously mid-page), an action-button toolbar, sectioned/labeled cards for each status group and orders, and all three modals converted from inline blocks to centered dark-overlay cards.
- **Decisions**:
  - Hashing happens server-side, not client-side — a client-supplied hash could be faked to fabricate proof of an upload that never happened; server-side hashing ties the fingerprint to bytes the server actually received. Sha256 dedup only catches identical re-uploads, it does not verify photo *content* — content-level fraud detection is out of scope for MVP per the spec's Variance Decision section.
  - Add Purchase Order was assigned to Claude to write directly (not hint-and-wait) since it's a repeat of an already-learned pattern (modal + nested item builder + POST), per claude-rule §0's speed-vs-learning split.
- **Debugging notes**: `python-multipart` wasn't installed, causing a `RuntimeError` on startup once the upload endpoint was added — installed via pip. `.env` DB password was accidentally echoed to a terminal transcript during setup; flagged to the user to rotate the credential.
- **Next**: procurement dashboard budget overview (spent vs budgeted per project); budget auto-deduct on purchase-order logging; create-user endpoint; RLS policy stubs; style the login page.

### Session 2026-07-03: Pivot to PO fulfillment + storage (v2)
- **Goal**: Capture the real requirements from the manager's call and reframe the project around them.
- **Changes**:
  - `docs/Project-Spec-v2.md` created: full v2 spec. PO ingested from the company's accounting ERP (not authored here), goods receipt with per-line condition checklist (partial deliveries, damaged-package cases, return-to-supplier), hierarchical storage locations (head office / factory / หน่วยงาน), append-only `stock_movements` + maintained `stock_levels`, withdrawals (เบิก) against projects, equipment lifecycle deferred to Phase C. Includes migration steps, decision log, and 19 questions for the manager.
  - `docs/Project-Spec.md` marked superseded (kept as v1 record).
  - Backlog rewritten around the pivot; budget features retired (budget lives in the ERP).
- **Decisions**:
  - Stock is modeled as append-only movements + a maintained levels table, extending the v1 audit-first design.
  - v1 tables stay in place (soft-deprecated), no destructive migration. Delivery-photo pipeline is reused as the receipt evidence mechanism.
  - Performance concern answered in the spec: their volume is decades away from Postgres limits; the real risk is model/workflow mismatch, mitigated by the ERD diff and pilot.
- **Next**: diff the manager's ER diagram against the spec, ask questions #1/#8/#19 first, then start Phase A (locations + items CRUD).

<!--
Template for the next session:

### Session YYYY-MM-DD — <short title>
- **Goal**: …
- **Changes**: files touched, key commits.
- **Decisions**: any non-obvious choices and why.
- **Unfinished**: what's mid-flight, where to resume.
- **Next**: explicit next step for the following session.
-->
