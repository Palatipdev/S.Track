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
| `docs/Project-Spec.md` | What we're building. The product spec. |
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

### Backlog
- [ ] Photo upload pipeline (Supabase Storage → server-side sha256 → `delivery_photos`).
- [ ] Budget auto-deduct on purchase-order logging (spec Feature #4).
- [ ] Style the dashboard with Tailwind.
- [ ] Create-user endpoint (replace hand-inserted test users).
- [ ] Add Row-Level Security (RLS) policy stubs scoped by `company_id`.
