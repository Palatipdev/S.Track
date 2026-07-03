# S.Track v2 — PO Fulfillment & Storage Spec (Pivot)

Status: draft, pending review against the manager's ER diagram
Date: 2026-07-03
Source: requirements call with the company manager (aunt), plus advice call with their infra engineer

---

## One-Sentence Pitch

S.Track takes purchase orders created in the company's existing accounting ERP and tracks everything the ERP can't see: what actually arrived, in what condition, where it's stored, who withdrew it for which project, and what's left.

---

## Why the Pivot

v1 was built on invented requirements: request → approval → create PO → delivery. The real company already creates POs in an accounting ERP. Nobody needs another PO creator. What they need is the other half: receiving, condition checking, multi-location stock, and withdrawal tracking. This is real customer input, so it wins.

The v1 fraud thesis survives in a new form. Instead of catching inflation between request and order, we catch loss between order and use: goods that never arrived, arrived damaged, or vanished from storage.

---

## What Stays / What Changes

| Piece | Fate |
|---|---|
| Supabase + FastAPI + Next.js stack | Stays |
| Auth, multi-tenancy, `company_id` scoping | Stays |
| Suppliers table | Stays |
| Deliveries + delivery photos (hash, GPS, server timestamps) | Stays, becomes the "goods receipt" flow |
| Append-only event tables, soft delete, server timestamps | Stays, extended to stock movements |
| Material requests → approval flow | Demoted. Tables kept for now, UI de-emphasized. May return later as the เบิก approval flow |
| PO creation UI | Repurposed: POs are now *ingested* (entered/imported from the ERP), not authored here |
| Requested-vs-ordered variance | Retired. New integrity signal: ordered vs received vs accepted per PO line |
| Budget auto-deduct | Parked. Budget lives in the ERP; revisit only if she asks |

---

## Roles (draft, confirm with manager)

| Role | Ingest PO | Receive goods | Approve receipt | Withdraw (เบิก) | Approve withdrawal | Add stock codes | View all |
|---|---|---|---|---|---|---|---|
| Owner | ✅ | — | ✅ | — | ✅ | — | ✅ |
| Supervisor | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Purchaser | ✅ | — | — | — | — | — | Assigned |
| Accountant | — | — | — | — | — | ✅ | ✅ (read) |
| Storage keeper / user | — | ✅ | — | ✅ | — | — | Own location |

Note from call: "user can approve for delivery but can't approve for material." Interpretation: regular users confirm goods arriving, but material withdrawal needs someone senior. Confirm this.

---

## Domain Model (v2 entities)

Carried over: `companies`, `users`, `projects`, `project_members`, `suppliers`, event tables.

### storage_locations
Hierarchical. Head office store (high-value items), factory, and site units (หน่วยงาน broken into หน่วย).
- `id`, `company_id`, `parent_id` (nullable FK to self), `name`, `type` (`head_office` | `factory` | `site_unit`), `deleted_at`, `created_at`

### items (master catalog)
One row per stock code. Accounting owns the codes (เพิ่มรหัส stock).
- `id`, `company_id`, `code` (unique per company), `name`, `category` (electric, hydraulic, tractor, ...), `item_type` (`material` | `equipment`), `unit`, `deleted_at`, `created_at`

### purchase_orders (new meaning: ingested, not authored)
- `id`, `company_id`, `po_number` (from ERP, unique per company), `supplier_id`, `project_id` (nullable), `status` (`open` | `partially_received` | `received` | `closed` | `cancelled`), `expected_delivery`, `deleted_at`, `created_at`

### po_lines
Expected distribution lives here: each line knows which location it should end up at.
- `id`, `purchase_order_id`, `item_id`, `ordered_qty`, `unit`, `unit_cost`, `destination_location_id`

### receipts (evolution of v1 deliveries)
One receipt = one physical arrival event. Partial deliveries are normal: many receipts per PO.
- `id`, `company_id`, `purchase_order_id`, `location_id`, `received_by`, `gps_lat`, `gps_lng`, `note`, `created_at`
- Photos: existing `delivery_photos` pattern (file_key, sha256, server timestamp)

### receipt_lines (the condition checklist)
The call's key requirement: packages can look fine but contain broken goods, or look damaged unopened.
- `id`, `receipt_id`, `po_line_id`, `received_qty`, `accepted_qty`, `rejected_qty`, `condition` (`good` | `damaged_package_unopened` | `damaged` | `wrong_item`), `condition_note`, `return_to_supplier` (bool)

### stock_movements (append-only spine)
Every change to stock is an INSERT here. Never UPDATE, never DELETE. Same integrity philosophy as v1's event tables.
- `id`, `company_id`, `item_id`, `location_id`, `movement_type` (`receive` | `withdraw` | `transfer_in` | `transfer_out` | `return_to_supplier` | `dispose` | `adjust`), `qty`, `project_id` (nullable, required for withdraw), `actor_id`, `ref_type`/`ref_id` (points at receipt, withdrawal, etc.), `created_at`

### stock_levels
Current qty per item per location. Maintained transactionally alongside each movement insert; movements are the audit trail, this is the fast lookup.
- `item_id`, `location_id`, `qty` (composite PK)

### withdrawals (เบิก)
Who took what, when, for which project.
- `id`, `company_id`, `project_id`, `location_id`, `requested_by`, `status` (pending approval? confirm with manager), `created_at`
- `withdrawal_lines`: `item_id`, `qty`

### equipment + repairs — v2 phase, design later
Equipment units (serial-tracked), repair status (`in_use` | `in_repair` | `out_of_stock` | `disposed`), condition feedback after repair, depreciation rate supplied by accounting. Deliberately out of the first build. See Phasing.

---

## Core Flow (v1 of the pivot)

1. **Ingest PO**: purchaser enters the PO from the ERP (manual form first, CSV import later). Lines get a destination location each.
2. **Supplier delivers** to a location. Storage keeper opens the app, picks the PO, logs a **receipt**: per line, received qty, accepted vs rejected, condition, note, photo, GPS. Server stamps time and hash.
3. Accepted qty creates `receive` **stock movements** at that location; `stock_levels` update; PO line fulfillment progress updates (`ordered` vs `received so far`). PO flips to `partially_received` / `received` automatically.
4. Rejected goods flagged `return_to_supplier` create a paper trail for the return.
5. **Withdraw (เบิก)**: worker/supervisor logs a withdrawal against a project from a location. Stock decrements, and the project accumulates its material usage.
6. **Dashboards**: manager sees stock per location, PO fulfillment progress, pending returns, and per-project consumption.

## Phasing

- **Phase A (build now)**: locations, items, PO ingest, receipts + checklist, stock movements/levels, withdrawals, stock dashboard.
- **Phase B**: transfers between locations, stocktake/adjustments, CSV import of POs, approval workflow on withdrawals.
- **Phase C**: equipment lifecycle (repair, depreciation, disposal), notifications, ERP API integration if ever possible.

## Out of Scope (unchanged unless she pushes)

Thai localization (ask, workers may need it), barcode scanning, offline mode, native app, accounting write-back to the ERP.

---

## Performance Answer (for the manager's concern)

Postgres at this company's realistic volume (tens of POs per week, a few thousand movements per month) is nowhere near any performance limit. Indexed, company-scoped queries stay fast into the tens of millions of rows, which is decades of their data. The genuine risks are modeling mistakes and workflows that don't match how workers actually behave, which is exactly what the ERD collaboration and pilot are for. Deployment for a pilot needs a real host (Docker + cloud per the infra engineer's advice), which also answers "will it be slow" better than any local demo.

---

## Migration Steps from Current Codebase

1. Review this spec against the manager's ER diagram; reconcile entity by entity, keep a decision log below.
2. Write v2 DDL: new tables above. Keep v1 tables in place (soft-deprecated), no destructive migration.
3. Backend order of work: locations + items CRUD → PO ingest → receipts w/ checklist (reuse delivery photo pipeline) → stock movements/levels → withdrawals.
4. Frontend order of work: PO list with fulfillment progress → receive flow (mobile-first, this is the phone-in-the-field screen) → stock view per location → withdraw flow → manager dashboard.
5. Seed real item codes from accounting as pilot data.
6. Dockerize + deploy for the family pilot.

## Decision Log

- 2026-07-03: Stock modeled as append-only `stock_movements` + maintained `stock_levels`, matching the v1 audit-first design. Derived-only (view over movements) rejected for now: simpler to read, but every stock lookup pays the aggregation cost and it complicates indexing.
- 2026-07-03: POs ingested manually first. CSV import deferred until we see a real ERP export.

---

## Questions for the Manager

**PO / ERP**
1. Can the ERP export POs (Excel/CSV)? What columns does a PO actually have? Get one real example PO.
2. Is a PO always tied to one project and one supplier, or can it mix?
3. What does the PO numbering look like, and is it unique forever?

**Receiving**
4. Who physically receives goods at each location type? Do they carry smartphones, and is there internet at the sites?
5. What reject reasons do they use today when a delivery is bad? (Fixed list beats free text.)
6. Partial deliveries: when is a PO line considered "close enough" to close? Is under-delivery ever accepted?
7. What is the actual return-to-supplier process? Who negotiates, what proof do they keep?

**Stock / Withdrawal**
8. Does เบิก need approval before stock leaves? By whom? (The call notes say users approve deliveries but not material, need the exact rule.)
9. Do units transfer stock between each other? Who authorizes?
10. Is there periodic stocktaking? How do they handle count mismatches today?
11. Does accounting already have the full stock code list (รหัส)? Can we get it as a file?
12. What units of measure exist (bag, pcs, m, ลูก, ...)? Standard list?

**Equipment (for Phase C, ask early anyway)**
13. What separates "equipment" from "material" in their heads? Serial numbers?
14. Depreciation: what method and where do the rates come from? Straight-line per category?
15. Repairs: internal team or external vendor? What statuses matter to her?

**People / UI**
16. Full role list and who can do what (owner, supervisor, purchaser, accountant, storage keeper, worker)?
17. Does the UI need to be in Thai for workers?
18. Rough volumes: POs per week, number of active items, number of locations, number of users?
19. The killer question: what does she want to see on one screen every morning? Build that screen first.
