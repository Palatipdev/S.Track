-- =============================================================================
-- SorTrack — English demo seed (wipe + reload)
-- =============================================================================
-- Run ONCE in the Supabase SQL editor. It clears all demo/transactional data
-- and reloads a clean English dataset for an English-language demo.
--
-- KEEPS: companies, users (so your login + the existing owner user id 1 survive).
-- WIPES + RELOADS: projects, suppliers, locations, items, POs, receipts, stock.
--
-- Result on screen:
--   Purchase Orders:  Open 2 · Partially Received 2 · Received 1 · Total 64,000
--   Stock spread across Central Store / Bangkok Unit / Chiang Mai Unit
-- Every "received" number is backed by a real receipt + stock movement.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Wipe everything except companies + users
-- ---------------------------------------------------------------------------
TRUNCATE
  projects, project_members, suppliers,
  material_requests, request_items,
  purchase_orders, order_items,
  deliveries, delivery_items, delivery_photos,
  request_events, order_events, delivery_events,
  storage_locations, location_members, items, po_items,
  receipts, receipt_lines, receipt_photos,
  stock_movements, stock_levels,
  withdrawals, withdrawal_lines
RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------------------
-- 1. Projects
-- ---------------------------------------------------------------------------
INSERT INTO projects (company_id, name, budget, status, start_date)
VALUES
  (1, 'Sala Bodhgaya (BR69011)', 5000000, 'active', DATE '2026-01-15'),
  (1, 'Office Building (BR69022)', 3000000, 'active', DATE '2026-03-01');

-- ---------------------------------------------------------------------------
-- 2. Suppliers
-- ---------------------------------------------------------------------------
INSERT INTO suppliers (company_id, name)
VALUES
  (1, 'ThaiBuild Materials'),
  (1, 'HomePro Supplies'),
  (1, 'SC Steel & Pipe');

-- ---------------------------------------------------------------------------
-- 3. Storage locations: Central -> Unit -> Project site (+ a 2nd unit)
-- ---------------------------------------------------------------------------
INSERT INTO storage_locations (company_id, parent_storage_id, project_id, name, type)
VALUES (1, NULL, NULL, 'Central Store', 'central');

INSERT INTO storage_locations (company_id, parent_storage_id, project_id, name, type)
SELECT 1, sl.id, NULL, 'Bangkok Unit', 'unit'
FROM storage_locations sl WHERE sl.name = 'Central Store' AND sl.company_id = 1;

INSERT INTO storage_locations (company_id, parent_storage_id, project_id, name, type)
SELECT 1, sl.id, NULL, 'Chiang Mai Unit', 'unit'
FROM storage_locations sl WHERE sl.name = 'Central Store' AND sl.company_id = 1;

INSERT INTO storage_locations (company_id, parent_storage_id, project_id, name, type)
SELECT 1, sl.id, p.id, 'Site Store BR69011', 'project_site'
FROM storage_locations sl
CROSS JOIN projects p
WHERE sl.name = 'Bangkok Unit' AND sl.company_id = 1
  AND p.name = 'Sala Bodhgaya (BR69011)' AND p.company_id = 1;

-- ---------------------------------------------------------------------------
-- 4. Items
-- ---------------------------------------------------------------------------
INSERT INTO items (item_name, company_id, code, category, spec, base_unit, is_active)
VALUES
  ('Teak Wood 150cm', 1, 'MT-W-001', 'Construction', '2 1/2" x 7" x 150cm', 'pcs',    TRUE),
  ('Cement',          1, 'MT-C-001', 'Construction', NULL,                  'bag',    TRUE),
  ('Rebar DB12',      1, 'MT-S-001', 'Construction', 'DB12 x 10m',          'length', TRUE),
  ('THW Wire',        1, 'EL-001',   'Electrical',   '2.5 sq.mm',           'm',      TRUE),
  ('PVC Pipe',        1, 'PL-001',   'Plumbing',     '4 inch class 8.5',    'length', TRUE),
  ('Electric Drill',  1, 'TL-001',   'Tools',        'Bosch GSB 550',       'unit',   TRUE);

-- ===========================================================================
-- 5. Purchase orders (destination for all lines: Bangkok Unit)
-- ===========================================================================

-- PO 1 — SC10-6907-0001 — OPEN
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0001', 12000, DATE '2026-07-15', 'open', p.id
FROM suppliers s, projects p
WHERE s.name = 'ThaiBuild Materials' AND p.name = 'Sala Bodhgaya (BR69011)';

INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 20, 450, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0001' AND i.item_name = 'Teak Wood 150cm' AND loc.name = 'Bangkok Unit';
INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 20, 150, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0001' AND i.item_name = 'Cement' AND loc.name = 'Bangkok Unit';

-- PO 2 — SC10-6907-0002 — OPEN
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0002', 21000, DATE '2026-07-18', 'open', p.id
FROM suppliers s, projects p
WHERE s.name = 'SC Steel & Pipe' AND p.name = 'Office Building (BR69022)';

INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 30, 700, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0002' AND i.item_name = 'Rebar DB12' AND loc.name = 'Bangkok Unit';

-- PO 3 — SC10-6907-0003 — PARTIALLY RECEIVED (cement in, teak pending)
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0003', 13500, DATE '2026-07-05', 'partially_received', p.id
FROM suppliers s, projects p
WHERE s.name = 'ThaiBuild Materials' AND p.name = 'Sala Bodhgaya (BR69011)';

INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 10, 450, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0003' AND i.item_name = 'Teak Wood 150cm' AND loc.name = 'Bangkok Unit';
INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 60, 150, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0003' AND i.item_name = 'Cement' AND loc.name = 'Bangkok Unit';

INSERT INTO receipts (company_id, purchase_order_id, location_id, received_by, note)
SELECT 1, po.id, loc.id, 1, 'Cement received in full; teak not yet delivered'
FROM purchase_orders po, storage_locations loc
WHERE po.po_number = 'SC10-6907-0003' AND loc.name = 'Bangkok Unit';

INSERT INTO receipt_lines (receipt_id, po_item_id, received_qty, accepted_qty, rejected_qty, condition, return_to_supplier)
SELECT r.id, poi.id, 60, 60, 0, 'good', FALSE
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN po_items poi ON poi.po_id = po.id
JOIN items i ON i.id = poi.item_id
WHERE po.po_number = 'SC10-6907-0003' AND i.item_name = 'Cement';

INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type, ref_id)
SELECT 1, i.id, loc.id, 'receive', 60, 1, 'receipt', r.id
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN storage_locations loc ON loc.id = r.location_id
JOIN items i ON i.item_name = 'Cement'
WHERE po.po_number = 'SC10-6907-0003';

-- PO 4 — SC10-6907-0004 — PARTIALLY RECEIVED (7 accepted, 1 damaged returned)
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0004', 8000, DATE '2026-07-06', 'partially_received', p.id
FROM suppliers s, projects p
WHERE s.name = 'HomePro Supplies' AND p.name = 'Sala Bodhgaya (BR69011)';

INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 16, 500, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0004' AND i.item_name = 'Teak Wood 150cm' AND loc.name = 'Bangkok Unit';

INSERT INTO receipts (company_id, purchase_order_id, location_id, received_by, note)
SELECT 1, po.id, loc.id, 1, 'Partial delivery; 1 unit damaged, returned to supplier'
FROM purchase_orders po, storage_locations loc
WHERE po.po_number = 'SC10-6907-0004' AND loc.name = 'Bangkok Unit';

INSERT INTO receipt_lines (receipt_id, po_item_id, received_qty, accepted_qty, rejected_qty, condition, condition_note, return_to_supplier)
SELECT r.id, poi.id, 8, 7, 1, 'damaged', '1 plank broken', TRUE
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN po_items poi ON poi.po_id = po.id
JOIN items i ON i.id = poi.item_id
WHERE po.po_number = 'SC10-6907-0004' AND i.item_name = 'Teak Wood 150cm';

INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type, ref_id)
SELECT 1, i.id, loc.id, 'receive', 7, 1, 'receipt', r.id
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN storage_locations loc ON loc.id = r.location_id
JOIN items i ON i.item_name = 'Teak Wood 150cm'
WHERE po.po_number = 'SC10-6907-0004';

-- PO 5 — SC10-6907-0005 — RECEIVED (all lines accepted)
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0005', 9500, DATE '2026-06-28', 'received', p.id
FROM suppliers s, projects p
WHERE s.name = 'SC Steel & Pipe' AND p.name = 'Office Building (BR69022)';

INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 10, 700, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0005' AND i.item_name = 'Rebar DB12' AND loc.name = 'Bangkok Unit';
INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 25, 100, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0005' AND i.item_name = 'PVC Pipe' AND loc.name = 'Bangkok Unit';

INSERT INTO receipts (company_id, purchase_order_id, location_id, received_by, note)
SELECT 1, po.id, loc.id, 1, 'All items received in good condition'
FROM purchase_orders po, storage_locations loc
WHERE po.po_number = 'SC10-6907-0005' AND loc.name = 'Bangkok Unit';

INSERT INTO receipt_lines (receipt_id, po_item_id, received_qty, accepted_qty, rejected_qty, condition, return_to_supplier)
SELECT r.id, poi.id, poi.item_qty, poi.item_qty, 0, 'good', FALSE
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN po_items poi ON poi.po_id = po.id
WHERE po.po_number = 'SC10-6907-0005';

INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type, ref_id)
SELECT 1, poi.item_id, r.location_id, 'receive', poi.item_qty, 1, 'receipt', r.id
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN po_items poi ON poi.po_id = po.id
WHERE po.po_number = 'SC10-6907-0005';

-- ---------------------------------------------------------------------------
-- 6. Leftover stock across locations (opening balances via 'adjust')
-- ---------------------------------------------------------------------------
-- Central Store
INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type)
SELECT 1, i.id, loc.id, 'adjust', v.qty, 1, 'seed'
FROM (VALUES ('Teak Wood 150cm', 40), ('Cement', 100), ('Rebar DB12', 25), ('Electric Drill', 5)) AS v(item_name, qty)
JOIN items i ON i.item_name = v.item_name AND i.company_id = 1
JOIN storage_locations loc ON loc.name = 'Central Store' AND loc.company_id = 1;

-- Bangkok Unit (leftover on top of received stock)
INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type)
SELECT 1, i.id, loc.id, 'adjust', v.qty, 1, 'seed'
FROM (VALUES ('Teak Wood 150cm', 2), ('THW Wire', 30), ('PVC Pipe', 8)) AS v(item_name, qty)
JOIN items i ON i.item_name = v.item_name AND i.company_id = 1
JOIN storage_locations loc ON loc.name = 'Bangkok Unit' AND loc.company_id = 1;

-- Chiang Mai Unit
INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type)
SELECT 1, i.id, loc.id, 'adjust', v.qty, 1, 'seed'
FROM (VALUES ('Cement', 15), ('Rebar DB12', 4), ('PVC Pipe', 20)) AS v(item_name, qty)
JOIN items i ON i.item_name = v.item_name AND i.company_id = 1
JOIN storage_locations loc ON loc.name = 'Chiang Mai Unit' AND loc.company_id = 1;

-- ---------------------------------------------------------------------------
-- 7. Rebuild stock_levels from all movements (single source of truth)
-- ---------------------------------------------------------------------------
INSERT INTO stock_levels (item_id, location_id, qty)
SELECT item_id, location_id, SUM(qty)
FROM stock_movements
GROUP BY item_id, location_id
ON CONFLICT (item_id, location_id) DO UPDATE SET qty = EXCLUDED.qty;

COMMIT;

-- =============================================================================
-- Expected after running:
--   Purchase Orders:  Open 2 (0001,0002) · Partial 2 (0003,0004) · Received 1 (0005)
--   Total value: 64,000
--   Stock:
--     Central Store:   Teak 40 · Cement 100 · Rebar 25 · Drill 5
--     Bangkok Unit:    Cement 60 · Teak 9 · Rebar 10 · PVC 33 · THW Wire 30
--     Chiang Mai Unit: Cement 15 · Rebar 4 · PVC 20
-- =============================================================================
