# S.Track

Construction materials procurement visibility dashboard. Replaces Excel + WhatsApp for small-to-mid construction firms. Multi-tenant SaaS.

## Repo layout
```
/
├── frontend/      Next.js 16 app (Vercel deploy)
├── backend/       Python FastAPI + SQLAlchemy service
├── sql/           Postgres schema + ERD
├── docs/          Project spec, context, rules, learning log
├── README.md
├── AGENTS.md      Next.js 16 agent rules
└── CLAUDE.md      Claude Code project instructions
```

## Stack
- **Frontend**: Next.js 16.2.3 (App Router), React 19, Tailwind v4, TypeScript
- **Backend**: Python FastAPI + SQLAlchemy
- **DB / Storage / Auth**: Supabase (Postgres + Storage + Auth)
- **Hosting**: Vercel (frontend), Railway or Fly.io (FastAPI)

## Documents to read in order

| File | Purpose |
|---|---|
| `docs/Project-Context.md` | Where we left off last session. Read first. |
| `docs/Project-Spec-v2.md` | Current direction: PO fulfillment + storage (pivot from real customer requirements). |
| `docs/Project-Spec.md` | Original v1 spec, superseded but kept as record. |
| `docs/claude-rule.md` | How Claude must write code on this project (80/20, vertical slices). |
| `docs/learned.md` | User's personal learning log. User-owned. |
| `AGENTS.md` | Reminder: Next.js 16 has breaking changes — consult `frontend/node_modules/next/dist/docs/`. |

## Scripts
Run from `frontend/`:
```
cd frontend
npm run dev     # Next.js dev server
npm run build
npm run lint
```
Backend runs from `backend/` (venv): `uvicorn app.main:app --reload`.

---

## Tasks

### Schema — done
- [x] Lock the schema in `docs/Project-Spec.md`.
- [x] Write Postgres DDL — `sql/schema.sql` (15 tables, 5 enums).
- [x] Create Supabase project (Tokyo, Data API off, RLS auto-enable on).
- [x] Apply schema to Supabase; all 15 tables confirmed live.
- [ ] Capture Supabase connection string + service role key in `.env.local` (do NOT commit).
- [ ] Add Row-Level Security (RLS) policy stubs scoped by `company_id`.

### Backend scaffold — done
- [x] Scaffold `backend/` with FastAPI + SQLAlchemy + Alembic.
- [x] SQLAlchemy models for all 15 tables in `backend/app/models.py`.
- [x] Alembic initialised and stamped at baseline.
- [x] `GET /health` endpoint confirmed working.

### First vertical slice — done
- [x] Pydantic schemas for `material_requests` + nested `request_items`.
- [x] `POST /material-requests` endpoint (header + items insert).
- [x] JWT verification on FastAPI via Supabase client (`get_current_user`).
- [x] `company_id` / `requested_by` filled from the verified token, confirmed with a 200.

### Requests & approval — done
- [x] Login page with Supabase Auth (`frontend/app/login/page.tsx`).
- [x] Dashboard fetching `GET /material-requests`, split into pending/approved/rejected.
- [x] Add-request modal (project/urgency/reason + nested items) → `POST /material-requests`.
- [x] `PATCH /material-requests/{id}` owner-only approve/reject, wired to buttons.
- [x] `GET /material-requests/{id}/items` + expand-on-click item list.
- [x] Logout button; CORS wired on FastAPI; root `app/page.tsx` redirects to `/login`.

### Purchase orders & variance — done
- [x] `POST /purchase-orders` (server-summed `total_cost`, rejects non-approved requests).
- [x] `order_items.request_item_id` FK so variance ties to the exact requested line.
- [x] `GET /purchase-orders` with per-item variance %, `flagged` when any item >10%.
- [x] Frontend orders list with red highlight over the 10% threshold.
- [x] `POST/GET /projects`, `POST/GET /suppliers` (company-scoped).

### Delivery confirmation — done
- [x] `POST /deliveries` (header + delivery_items).
- [x] `GET /purchase-orders/{id}/items` to feed the delivery modal.
- [x] Order-picker dropdown (fetch-on-select) + per-item `received_qty` inputs.
- [x] `handleDelivery` builds the `items` array and POSTs to `/deliveries`, tested end-to-end.

### Delivery photos & purchase order UI — done
- [x] `POST /deliveries/{id}/photos` — multipart upload, server-side sha256, Supabase Storage bucket `delivery-photos`.
- [x] Frontend file input (camera/gallery capture) + `FormData` upload, gated on a confirmed delivery id.
- [x] Add Purchase Order modal (approved-request picker → items → supplier/date/unit-cost → `POST /purchase-orders`).
- [x] Fixed single-option dropdown bug (missing placeholder `<option>` meant `onChange` never fired).
- [x] Dashboard styled with Tailwind — header, toolbar, sectioned cards, modal overlays.

### Backlog (v1, retired by pivot)
- [ ] Procurement dashboard budget overview (spent vs budgeted per project).
- [ ] Budget auto-deduct on purchase-order logging (spec Feature #4).
- [ ] Style the login page with Tailwind.
- [ ] Create-user endpoint (replace hand-inserted test users).
- [ ] Add Row-Level Security (RLS) policy stubs scoped by `company_id`.

---

## v2 Pivot — Phase A: CORE DONE (2026-07-06)

Real requirements from the company manager. See `docs/Project-Spec-v2.md` for the full spec.

### Backend — done
- [x] v2 SQLAlchemy models: `storage_locations`, `location_members`, `items`, `po_items`, `receipts`, `receipt_lines`, `receipt_photos`, `stock_movements`, `stock_levels`, `withdrawals`, `withdrawal_lines`.
- [x] `purchase_orders` reworked for ingest (dropped `material_request_id`, added `po_number`, `project_id`); `OrderStatus` enum migrated to `open`/`partially_received`/`received`/`closed`/`cancelled`.
- [x] Locations + Items CRUD (`POST`/`GET /storage_location`, `POST`/`GET /items`).
- [x] `POST`/`GET /purchase-orders`, `GET /purchase-orders/{id}/po-items`.
- [x] `POST /receipt` — creates receipt + lines, inserts `stock_movements`, upserts `stock_levels`, derives PO `open`/`partially_received`/`received` status from ordered-vs-accepted across all po_items.
- [x] `POST /receipt/{id}/photos` — server-side sha256, same pattern as v1 delivery photos.
- [x] `POST`/`GET /withdrawal`, `GET /stock_level/{location_id}` (company-scoped).

### Frontend — done
- [x] `dashboard/layout.tsx` — sidebar nav (desktop) + bottom tabs (mobile), shared across all v2 pages.
- [x] `/dashboard` — PO list grouped by status, stat tiles, Add Purchase Order modal.
- [x] `/dashboard/po/[id]` — PO detail with item name/spec/location joins, links to receive flow.
- [x] `/dashboard/receive` — FM-003 receipt form (per-line received/accepted/rejected/condition).
- [x] `/dashboard/stock` — location picker + stock table, search-by-name, negative-qty flagged red.
- [x] `/dashboard/withdraw` — FM-004 withdrawal form, location→stock-scoped item picker, over-stock warning.
- [x] `/dashboard/items`, `/dashboard/locations` — catalog/hierarchy admin pages (type-filtered parent picker, project link only for `project_site`).

### Backlog (Phase A follow-ups)
- [ ] Receipt photo upload not wired into the receive form yet (needs `receipt.id` from POST response first).
- [ ] `GET /receipt/{id}` and `GET /withdrawal/{id}` detail views (optional, not blocking).
- [ ] `location_members` assignment — deferred to a future self-service "join your location" flow, not an admin picker.
- [ ] Visual pass — current UI is functional but templated; reference designs pending.
