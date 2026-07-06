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

## Alignment with SBR-MMS (the manager's own design work)

The manager is designing the company's process standard ("SBR-MMS", forms FM-001–009, processes P-01–P-07) in parallel, via her own ChatGPT sessions (transcript reviewed 2026-07-04). Rule: **her manual and this app are one system, not two.** The app digitizes her forms; screens adopt her form codes so paper standard and software stay identical by construction.

| Her form | Meaning | App equivalent |
|---|---|---|
| FM-001 แผนการใช้วัสดุรายสัปดาห์ | Weekly material plan (BOQ-driven) | Out of app scope for now (planning subsystem) |
| FM-002 ใบขอซื้อวัสดุ | Purchase request, approval chain: store chain checks → project management approves | v1 `material_requests` flow returns here — Phase B |
| FM-003 ใบรับวัสดุ | Goods receipt, no approver | `receipts` + `receipt_lines` — Phase A |
| FM-004 ใบเบิกวัสดุ | Withdrawal: requester fills, project store verifies, **no approver** | `withdrawals` — Phase A, single-step |
| FM-005 ใบโอนวัสดุ | Transfer between stores | `stock_movements` transfer types — Phase B |
| FM-006 ใบคืนวัสดุ | Return of leftover material | `return` movement — Phase B |
| FM-007 ใบตรวจสภาพ | Condition inspection before reuse | inspection record — Phase B |
| FM-008 ใบตัดจำหน่าย | Disposal/write-off (management approves, accounting receives) | `dispose` movement — Phase B/C |
| FM-009 รายงานปิดโครงการ | Project closing report | report — Phase C |

Her stated highest-value outcome: leftover material from finished projects returning to stock, getting condition-checked, and being reused in new projects instead of sitting abandoned at sites. The return/reuse loop is the pilot's centerpiece feature and the demo that will land with her.

Scope guard: her ChatGPT sessions are inflating the paper project toward "SBR-OS" (5 subsystems, 120–150 page manual). The app deliberately targets only the store core (P-03 → P-06). Planning, purchasing upstream (BOQ → plan → PR), cost control, and knowledge management stay out of the app until the store core is piloted.

---

## What Stays / What Changes

| Piece | Fate |
|---|---|
| Supabase + FastAPI + Next.js stack | Stays |
| Auth, multi-tenancy, `company_id` scoping | Stays |
| Suppliers table | Stays |
| Deliveries + delivery photos (hash, GPS, server timestamps) | Stays, becomes the "goods receipt" flow |
| Append-only event tables, soft delete, server timestamps | Stays, extended to stock movements |
| Material requests → approval flow | Not deleted — confirmed real by the manager's own design (FM-002 ใบขอซื้อวัสดุ has a genuine approval chain: store checks → project management approves). Re-scoped to Phase B as the purchase-request flow, not attached to withdrawals (FM-004, which has no approver) |
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
Hierarchical, three confirmed levels from the manager's design: สโตร์กลาง (1 central store) → สโตร์หน่วยงาน (~10 unit stores) → สโตร์โครงการ (one per active project). New pattern: self-referencing FK (a location's parent is another location) — first time this project has modeled a hierarchy this way.
- `id`, `company_id`, `parent_id` (nullable FK to self), `name`, `type` (`central` | `unit` | `project_site`), `deleted_at`, `created_at`

### location_members (site leader assignment)
Same shape as the existing `project_members` join table, just for locations.
- `location_id` (FK), `user_id` (FK), `role` (text, e.g. `"leader"`), `PRIMARY KEY(location_id, user_id)`

### items (master catalog)
One row per exact stock variant (confirmed with the manager's example PO: same material at different dimensions — e.g. ไม้สัก at 150cm vs 160cm vs 170cm — are tracked as separate rows, not collapsed). `spec` is free text, not structured columns (width/thickness/length), because it varies per category (lumber has dimensions, cement doesn't, rebar has diameter) and filtering/search by spec is confirmed **not** needed — so no query requirement forces structure. Duplicate-row risk from inconsistent typing is solved at the UI layer: an autocomplete/picker over existing items forces reuse of the same row instead of retyping, rather than trying to parse or normalize text after the fact.
- `id`, `company_id`, `code` (nullable text — manager's draft scheme exists: `MT-C-001` cement, `MT-S-001` steel, `EL-001` electrical, `PL-001` plumbing, `TL-001` tools), `name` (e.g. "ไม้สัก"), `category` (confirmed set from her design: ก่อสร้าง / ไฟฟ้า / ประปา / เครื่องมือ), `spec` (text, nullable — e.g. `"2 1/2\" x 7\" x 150cm"`), `base_unit`, `is_active`, `deleted_at`, `created_at`
- **Open risk**: `base_unit` assumes one fixed unit per item. Confirm with manager whether the same item is ever bought/counted in different units (see Questions).

### purchase_orders (new meaning: ingested, not authored)
Real PO example (SC10-6907-0008) confirmed these fields exist and aren't in the original draft: VAT (7%), discount, a three-signature approval chain (ผู้สั่งซื้อ/ผู้ตรวจสอบ/ผู้อนุมัติ), and an "posted to accounting" (ลงบัญชีแล้ว) stamp with its own date. Dates on the physical PO are Buddhist calendar (พ.ศ.) — convert on ingest (`ce_year = parseInt(be_year) - 543`).
- `id`, `company_id`, `po_number` (text, matches ERP format e.g. `SC10-6907-0008`), `supplier_id`, `project_id` (nullable — PO example showed exactly one project per PO), `project_code` (text, e.g. `BR69011` — separate from `projects.name`), `status` (`open` | `partially_received` | `received` | `closed` | `cancelled`), `order_date`, `expected_delivery`, `subtotal`, `discount_amount`, `vat_amount`, `net_total`, `posted_to_accounting_at` (nullable), `deleted_at`, `created_at`

### po_lines
Expected distribution lives here: each line knows which location it should end up at. Real PO example showed two quantity concepts that aren't the same number: a piece count embedded in the free-text description (e.g. "จำนวน 8 ตัว") and a measured quantity in the `จำนวน` column used for pricing (e.g. 12.00 เมตร = 8 pieces × 1.5m each). Both are kept, not collapsed into one `quantity`.
- `id`, `purchase_order_id`, `item_id` (nullable — see note), `description` (text, verbatim from the PO, kept for audit even when `item_id` is linked), `piece_count` (nullable), `measured_qty`, `unit`, `unit_cost`, `destination_location_id`
- **Note**: `item_id` nullable because real PO line text is messy free text; a line should still be enterable even before it's matched/linked to a catalog `items` row.

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

### withdrawals (เบิก) — maps to FM-004
Who took what, when, for which project. Provisionally answered by the manager's own Data Flow Matrix: FM-004 has **no approver** — the requester (ผู้เบิก) fills it, the project store (สโตร์โครงการ) verifies it, and it takes effect. So this is a single-step log with a verifier, not an approval workflow. (One confirming sentence to the manager still outstanding; approval chains belong to FM-002 purchase requests, not withdrawals.)
- `id`, `company_id`, `project_id`, `location_id`, `requested_by`, `verified_by` (nullable FK to users — the store keeper who checked it), `created_at`
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

- **Phase A (build now)**: locations, items, PO ingest, receipts + checklist (FM-003), stock movements/levels, withdrawals (FM-004, single-step), stock dashboard.
- **Phase B — the return/reuse loop (her #1 value)**: returns (FM-006), condition inspection (FM-007), transfers between stores (FM-005), disposal (FM-008), "ของคืนจากโครงการ" visibility (leftover stock with original-project provenance), purchase requests w/ approval chain (FM-002), QR codes (generate per item/stock row, scan to receive/withdraw/transfer/return), stocktake/adjustments, CSV import if พจมาน can export.
- **Phase C**: equipment lifecycle (repair, depreciation, disposal), project closing report (FM-009), KPI/dashboard reports, notifications, ERP API integration if ever possible.

## Out of Scope (unchanged unless she pushes)

Thai localization of the UI (ask — workers likely need it, may pull into Phase B), offline mode, native app, accounting write-back to the ERP, the wider "SBR-OS" ambition (planning, cost control, knowledge management subsystems).

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

## Frontend Architecture (Phase A, decided 2026-07-06)

Multi-page app under `/dashboard`, not a single-page dashboard like v1. Shared shell in `dashboard/layout.tsx`: left sidebar nav on desktop (Dashboard, Receive, Stock, Withdraw, Items, Locations), collapsing to a bottom tab bar on mobile since Receive/Withdraw are phone-in-the-field screens. Dark theme carried over from v1; cards on neutral background, status shown as colored chips, one accent color for primary actions. No charts in Phase A — data is too sparse to fill them; stat tiles + tables instead. Charts revisit in Phase B/C reports.

| Route | Screen | Contents |
|---|---|---|
| `/dashboard` | PO overview (landing) | Stat tiles (open / partially received / total value), PO table grouped by status, Add PO modal (ingest form: po_number, supplier, project, expected date, line items w/ item picker + destination location) |
| `/dashboard/po/[id]` | PO detail | Header card, line items with ordered vs received progress per line, receipts history w/ photo thumbnails, "Receive against this PO" action |
| `/dashboard/receive` | Receive flow (FM-003), mobile-first | Step layout: pick PO → per-line received/accepted/rejected + condition + note → photo capture → GPS → submit. Header shows FM-003 code to match the paper standard |
| `/dashboard/stock` | Stock view | Location picker (grouped central → unit → project_site), stat tiles incl. negative-stock alerts, item table with search-by-name only |
| `/dashboard/withdraw` | Withdraw flow (FM-004), mobile-first | Pick project → location → item picker showing live stock qty → qty per line → submit. Warn, don't block, on qty > stock |
| `/dashboard/items` | Item catalog | Items table + Add Item modal; feeds the autocomplete pickers that enforce row reuse |
| `/dashboard/locations` | Storage locations | Hierarchy tree view, add-location modal w/ parent picker + member assignment |

Build order: PO list → PO detail → receive flow → stock view → withdraw flow → items/locations admin last (seed via Swagger until then).

## Decision Log

- 2026-07-03: Stock modeled as append-only `stock_movements` + maintained `stock_levels`, matching the v1 audit-first design. Derived-only (view over movements) rejected for now: simpler to read, but every stock lookup pays the aggregation cost and it complicates indexing.
- 2026-07-03: POs ingested manually first. CSV import deferred until we see a real ERP export.
- 2026-07-03: Reviewed a real PO (SC10-6907-0008) from the company. Confirmed VAT/discount fields, three-signature approval chain, an accounting-posted stamp/date, Buddhist calendar dates, and that project code (BR69011) is separate from project name — folded into `purchase_orders`.
- 2026-07-03: **Assumption, not confirmed with manager**: items are tracked as separate catalog rows per exact size/spec variant (e.g. each lumber dimension is its own row), based on domain knowledge of construction materials. Not asked directly to avoid wasting her time on something already known. Revisit if it turns out wrong.
- 2026-07-03: Confirmed with the user (not the manager) that spec-based filtering/search (e.g. "lumber under 2m") is not needed. This is why `items.spec` is a plain text field, not structured numeric columns — no query requirement exists to justify the structure.
- 2026-07-03: `po_lines` keeps both `piece_count` and `measured_qty` rather than one `quantity`, because the real PO shows they aren't the same number (8 pieces × 1.5m = 12.00m billed) and pricing is based on the measured quantity, not the piece count.
- 2026-07-03: Whether `stock_levels` should be counted by `piece_count` or `measured_qty` is unresolved — depends on how workers physically count stock in the yard. Assumed `piece_count` for now (matches how a person actually counts inventory); revisit if wrong.
- 2026-07-04: Reviewed the manager's own SBR-MMS ChatGPT transcript. Withdrawal approval question provisionally resolved (FM-004 has no approver; requester + store verification only — approval chains belong to purchase requests, FM-002). Store hierarchy corrected to central/unit/project_site (1 / ~10 / per-project). Item code scheme and category set adopted from her draft. Return/reuse loop promoted to the whole of Phase B as her stated highest-value outcome. QR codes moved from out-of-scope to Phase B. App screens will adopt her FM form codes so the paper standard and the software stay one system.
- 2026-07-04: Scope guard recorded: the manager's ChatGPT sessions are expanding her paper project toward "SBR-OS" (5 subsystems, 120–150 page manual). The app intentionally implements only the store core (P-03 → P-06) until the pilot proves out.

---

## Questions for the Manager

Only two questions actually block starting Phase A — everything else below is either already decided, a stated assumption, or safe to defer without risk of a schema rewrite later.

### Blocking — must answer before finalizing `items`/`po_lines` units

1. ~~**เบิก (withdrawal) approval**~~ — provisionally answered by her SBR-MMS transcript (2026-07-04): FM-004 has no approver, requester + project-store verification only. One confirming sentence still worth sending; `withdrawals` is buildable now as single-step.
   > Sent: "การเบิกของออกไปใช่ ต้องให้ผู้จัดการ (owner) อนุมัติไหมครับ หรือหัวหน้าหน่วยสามารถเบิกได้เลย"
2. **Unit consistency** (still open): is the same item ever bought/counted in different units across purchases (ไม้สัก sometimes เมตร, sometimes แผ่น/ตัว; ปูน sometimes ถุง, sometimes ตัน)? Decides whether `unit` stays fixed on `items` or has to move to per-transaction with conversion.
   > Sent: "ทุกครั้งที่ซื้อวัสดุเดิมเพิ่ม เรานับเปนหน่วยเดียวกันตลอดไหม (เช่น ไม้สัก = เมตร แต่บางทีเขียนเปนแผ่น/ตัว หรือ ปูน เปนถุง/ตัน)"
3. **New (high value, not schema-blocking): ask her for the FM form drafts** — especially FM-002, FM-003, FM-004. Her form layouts are literally the field specs for the app's screens; getting them early prevents building screens she'll ask to rearrange.

### Already resolved — do not re-ask

- Size/spec separation → assumed yes (see Decision Log).
- Spec filtering/search → confirmed not needed.

### Worth asking eventually, not blocking (cheap to adjust later — enum/constraint changes, not schema rewrites)

- Can the ERP/พจมาน export POs as a real file (not just "yes/no" — get an actual export if it exists)? Doesn't block Phase A since manual entry is the starting design regardless.
- What reject reasons do they use for bad deliveries today? (Fixed list beats free text — currently a placeholder enum: `good` | `damaged_package_unopened` | `damaged` | `wrong_item`.)
- Partial deliveries: when is a PO line "close enough" to close?
- Actual return-to-supplier process — who negotiates, what proof is kept.
- Is a PO ever split across projects/suppliers, or always one-to-one (the example PO showed one-to-one)?
- Full role list beyond what's drafted above.
- Does the UI need to be in Thai for workers?
- Rough volumes (POs/week, active items, locations, users) — informs whether performance is ever a real concern (it won't be, but good to confirm scale).
- What does she want to see on one screen every morning? Build that screen first once known.

### Deferred to Phase C entirely (equipment)

- What separates "equipment" from "material" — serial numbers?
- Depreciation method and rate source.
- Repair process — internal team or external vendor, what statuses matter.
