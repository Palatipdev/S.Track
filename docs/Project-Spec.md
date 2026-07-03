# S.Track — Procurement Visibility Dashboard

> **Superseded (2026-07-03):** real customer requirements arrived. See `Project-Spec-v2.md` for the current direction (PO fulfillment + storage). This file stays as the v1 record.

Last updated: 2026-05-06

## One-Sentence Pitch
S.Track replaces Excel and WhatsApp for construction materials procurement, giving business owners real-time visibility into what's ordered vs delivered to reduce fraud and eliminate paperwork chaos.

---

## Origin Story

At my family's construction business in Thailand, I watched us lose money two ways:

1. **Corruption:** Onsite teams inflated material requests (ordered 100 bags, needed 80, pocketed the difference). Buying teams made deals with suppliers for kickbacks. No one could verify what actually arrived on site.
2. **Chaos:** Project terms tracked over WhatsApp threads. Paperwork piled at home waiting for signatures. When my dad needed to check a contractor's payment schedule, he'd spend 20 minutes digging through chat history and Excel files.

**What got me started:** Fixing the redundant WhatsApp checking, getting everything in one place.
**What kept me going:** Realizing we could actually reduce BOQ fraud by forcing transparency.

---

## Primary User: Business Owner
- **Job:** See all pending material requests, approved orders, and delivery confirmations across multiple projects without digging through WhatsApp or paperwork.
- **Pain:** No single source of truth, delayed visibility, manual reconciliation.
- **Success metric:** Opens S.Track daily to check pending orders and variance alerts instead of asking people for updates.

## Secondary Users
- **Buying Team (Office):** approves requests, logs purchase orders.
- **Onsite Leader (Site):** submits material requests via mobile.
- **Office Engineer:** can also submit requests on behalf of site needs.
- **Factory Team:** confirms delivery on site with photo + GPS.

---

## Authorization Matrix

| Role     | Submit Request | Approve Request | Log Purchase Order | Confirm Delivery | View All Projects |
|----------|:--------------:|:---------------:|:------------------:|:----------------:|:-----------------:|
| Owner    | ✅             | ✅              | ✅                 | —                | ✅ (all in company)|
| Buyer    | —              | —               | ✅                 | —                | Assigned only     |
| Onsite   | ✅             | —               | —                  | ✅               | Assigned only     |
| Factory  | —              | —               | —                  | ✅               | Assigned only     |
| Engineer (office) | ✅    | —               | —                  | —                | Assigned only     |

> **Decision (2026-05-06):** Owner is the sole approver. Buyer logs purchase orders post-approval. Both onsite and office (engineer) roles can submit requests.

---

## Multi-Tenancy
- **Many companies on one app** (SaaS-style). Every row is scoped to a `company_id`.
- Implication: every query filters by `company_id`; users belong to one company.

---

## MVP Features

### 1. Projects Dashboard
View all active projects (name, budget, status, start date). Click → see all related requests/orders.

### 2. Material Request Submission
Onsite or office engineer submits: project, item, quantity, reason, urgency. Mobile-friendly form.

### 3. Approval Workflow (Owner-only)
Owner sees pending requests in queue. Approve/Reject with optional notes.

### 4. Purchase Order Logging
Buying team logs supplier, item, quantity, unit cost, total cost, expected delivery. Auto-deducts from project budget.

### 5. Delivery Confirmation
Onsite or factory team marks items "received" with delivery-receipt photo, GPS, and server-stamped timestamp.

### 6. Procurement Dashboard (Owner View)
- Pending Requests
- Open Orders
- **Variance Alerts: requested vs ordered (>10%)** — see decision below
- Budget Overview (spent vs budgeted per project)

---

## Variance Decision (MVP scope)

We catch **requested-vs-ordered variance** in MVP.
- Rationale: used-vs-delivered fraud only becomes detectable after the order is already placed (money is already gone). Catching the inflation at request → order is the earliest leverage point and the cheapest to enforce.
- Used-vs-delivered detection deferred to v2 (requires "materials consumed" feature).

---

## Integrity & Audit (non-negotiable from day one)
- **Append-only event log tables**: `request_events`, `order_events`, `delivery_events`. State changes = INSERTs only, never UPDATEs.
- **Soft delete only**: `deleted_at` column; no hard `DELETE`.
- **Server-stamped timestamps**: all `created_at`, `approved_at`, `delivered_at` set by the backend, never trusted from client.
- **Photo uploads**: store `(file_key, sha256_hash, server_uploaded_at)`. Hash on server-receive, not on client.

---

## Out of Scope (MVP)
- Notifications (in-app or LINE/WhatsApp) — **post-MVP**, low reward / high commitment.
- 3D models, client-facing viewer, AI fraud detection, Gantt charts.
- Contractor payment tracking, milestone progress, document/blueprint storage.
- Native mobile app (web-first, mobile-responsive PWA).
- Offline queueing on poor connectivity (document the assumption: requires online).

---

## Tech Stack
- **Frontend:** Next.js **16.2.3** (App Router), TypeScript, Tailwind v4
- **Backend:** Python FastAPI + SQLAlchemy
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Supabase Storage (photos)
- **Auth:** Supabase Auth (decision below)
- **Deployment:** Vercel (frontend), Railway or Fly.io (FastAPI)
- **Version Control:** Git / GitHub

### Why Supabase
Postgres + Storage + Auth + row-level security in one provider. Fits multi-tenant model (RLS by `company_id`). FastAPI talks to the same Postgres directly via SQLAlchemy; Supabase client used from Next.js for auth and signed photo URLs.

---

## Schema (working draft — to be finalized next session)

Tables:
- `companies` — tenant root
- `users` — `role enum (owner | buyer | onsite | factory | engineer)`, `company_id`
- `projects` — `company_id`, budget, dates, status
- `project_members` — which users on which project
- `suppliers` — per company
- `material_requests` — header (project, requester, status, urgency, reason)
- `request_items` — line items (item name, qty, unit)
- `purchase_orders` — header (request_id, supplier, total_cost, expected_delivery)
- `order_items` — line items (unit_cost, qty)
- `deliveries` — header (order_id, confirmed_by, gps_lat, gps_lng, server_uploaded_at)
- `delivery_items` — received qty per item
- `delivery_photos` — `(file_key, sha256_hash, server_uploaded_at)`
- `request_events` / `order_events` / `delivery_events` — append-only audit logs

PKs: `BIGINT` auto-increment for now; add `public_id uuid` later only if needed.
Money: `numeric(14,2)`. Timestamps: `timestamptz`, server-defaulted.

---

## Timeline
- **May 2026:** Spec finalized (✅), schema designed.
- **May–June 2026:** MVP build in vertical slices.
- **July 2026:** Working demo deployed.
- **Aug–Oct 2026:** Refine on family-business feedback, v2 features.
- **2027:** Pitch to Thai construction firms.

## Success Criteria
- ✅ Deployed at a live URL.
- ✅ Owner logs in, sees all company projects.
- ✅ Onsite/engineer submits request from phone.
- ✅ Owner approves; buyer logs PO; budget auto-deducts.
- ✅ Factory/onsite confirms delivery with photo + GPS.
- ✅ Variance alert triggers when requested vs ordered diverges >10%.
