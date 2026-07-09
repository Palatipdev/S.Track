-- =============================================================================
-- SorTrack — Demo seed data (5 purchase orders, honest mix)
-- =============================================================================
-- Run ONCE in the Supabase SQL editor, top to bottom.
--
-- Prerequisites (already in your DB per the Test Data Walkthrough):
--   - companies id 1
--   - users     id 1  (owner)
-- Everything else (projects, suppliers, locations, items, POs, receipts,
-- stock) is created below and tied together by name lookups, so you do NOT
-- have to know the generated ids.
--
-- Result on screen after running:
--   Purchase Orders page:  Open 2 · Partially received 2 · Received 1
--   Stock page (หน่วยกรุงเทพ): real quantities from the received/partial POs
--   Every "received" number is backed by a real receipt + stock_movement,
--   so nothing looks fake if the manager clicks in.
--
-- Idempotency: this script INSERTs fresh rows each run. Run it on a clean
-- demo DB. To re-run, delete the demo rows first (see teardown at bottom).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Projects (2)
-- ---------------------------------------------------------------------------
INSERT INTO projects (company_id, name, budget, status, start_date)
VALUES
  (1, 'โครงการ BR69011 ศาลาพุทธคยา', 5000000, 'active', DATE '2026-01-15'),
  (1, 'โครงการ BR69022 อาคารสำนักงาน', 3000000, 'active', DATE '2026-03-01');

-- ---------------------------------------------------------------------------
-- 2. Suppliers (3)
-- ---------------------------------------------------------------------------
INSERT INTO suppliers (company_id, name)
VALUES
  (1, 'ไทยวัสดุก่อสร้าง'),
  (1, 'โฮมโปร วัสดุภัณฑ์'),
  (1, 'เอส.ซี. สตีล แอนด์ ไพพ์');

-- ---------------------------------------------------------------------------
-- 3. Storage locations — hierarchy: central -> unit -> project_site
-- ---------------------------------------------------------------------------
-- central
INSERT INTO storage_locations (company_id, parent_storage_id, project_id, name, type)
VALUES (1, NULL, NULL, 'สโตร์กลาง', 'central');

-- unit (parent = central)
INSERT INTO storage_locations (company_id, parent_storage_id, project_id, name, type)
SELECT 1, sl.id, NULL, 'หน่วยกรุงเทพ', 'unit'
FROM storage_locations sl
WHERE sl.name = 'สโตร์กลาง' AND sl.company_id = 1;

-- project_site (parent = unit, tied to project BR69011)
INSERT INTO storage_locations (company_id, parent_storage_id, project_id, name, type)
SELECT 1, sl.id, p.id, 'สโตร์โครงการ BR69011', 'project_site'
FROM storage_locations sl
CROSS JOIN projects p
WHERE sl.name = 'หน่วยกรุงเทพ' AND sl.company_id = 1
  AND p.name = 'โครงการ BR69011 ศาลาพุทธคยา' AND p.company_id = 1;

-- ---------------------------------------------------------------------------
-- 4. Items (catalog, 6)
-- ---------------------------------------------------------------------------
INSERT INTO items (item_name, company_id, code, category, spec, base_unit, is_active)
VALUES
  ('ไม้สัก',       1, 'MT-W-001', 'ก่อสร้าง', '2 1/2" x 7" x 150cm', 'ตัว',  TRUE),
  ('ปูนซีเมนต์',   1, 'MT-C-001', 'ก่อสร้าง', NULL,                  'ถุง',  TRUE),
  ('เหล็กเส้น',    1, 'MT-S-001', 'ก่อสร้าง', 'DB12 ยาว 10 เมตร',    'เส้น', TRUE),
  ('สายไฟ THW',    1, 'EL-001',   'ไฟฟ้า',   '2.5 sq.mm',           'เมตร', TRUE),
  ('ท่อ PVC',      1, 'PL-001',   'ประปา',   '4 นิ้ว ชั้น 8.5',      'เส้น', TRUE),
  ('สว่านไฟฟ้า',   1, 'TL-001',   'เครื่องมือ', 'Bosch GSB 550',    'เครื่อง', TRUE);

-- ===========================================================================
-- Helper note: below, POs are inserted one at a time. Each block:
--   (a) inserts the purchase_orders header with an explicit status + total,
--   (b) inserts its po_items (linked by item name + the PO's po_number),
--   (c) for received/partial POs, inserts a receipt + receipt_lines +
--       stock_movements + stock_levels so the numbers are real.
-- Destination location for all lines: หน่วยกรุงเทพ (the unit store).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- PO #1  SC10-6907-0001 — OPEN (nothing received yet)
-- ---------------------------------------------------------------------------
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0001', 12000, DATE '2026-07-15', 'open', p.id
FROM suppliers s, projects p
WHERE s.name = 'ไทยวัสดุก่อสร้าง' AND p.name = 'โครงการ BR69011 ศาลาพุทธคยา';

INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 20, 450, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0001' AND i.item_name = 'ไม้สัก' AND loc.name = 'หน่วยกรุงเทพ';

INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 20, 150, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0001' AND i.item_name = 'ปูนซีเมนต์' AND loc.name = 'หน่วยกรุงเทพ';
-- total_cost 12000 = 20*450 + 20*150 = 9000 + 3000

-- ---------------------------------------------------------------------------
-- PO #2  SC10-6907-0002 — OPEN
-- ---------------------------------------------------------------------------
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0002', 21000, DATE '2026-07-18', 'open', p.id
FROM suppliers s, projects p
WHERE s.name = 'เอส.ซี. สตีล แอนด์ ไพพ์' AND p.name = 'โครงการ BR69022 อาคารสำนักงาน';

INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 30, 700, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0002' AND i.item_name = 'เหล็กเส้น' AND loc.name = 'หน่วยกรุงเทพ';
-- total_cost 21000 = 30*700

-- ---------------------------------------------------------------------------
-- PO #3  SC10-6907-0003 — PARTIALLY RECEIVED
--   cement fully received (accepted), wood NOT yet received -> partial
-- ---------------------------------------------------------------------------
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0003', 13500, DATE '2026-07-05', 'partially_received', p.id
FROM suppliers s, projects p
WHERE s.name = 'ไทยวัสดุก่อสร้าง' AND p.name = 'โครงการ BR69011 ศาลาพุทธคยา';

-- line A: ไม้สัก 10 @ 450  (NOT received)
INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 10, 450, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0003' AND i.item_name = 'ไม้สัก' AND loc.name = 'หน่วยกรุงเทพ';

-- line B: ปูนซีเมนต์ 60 @ 150  (received in full)
INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 60, 150, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0003' AND i.item_name = 'ปูนซีเมนต์' AND loc.name = 'หน่วยกรุงเทพ';
-- total_cost 13500 = 10*450 + 60*150 = 4500 + 9000

-- receipt header
INSERT INTO receipts (company_id, purchase_order_id, location_id, received_by, note)
SELECT 1, po.id, loc.id, 1, 'รับปูนครบ ไม้สักยังไม่มาส่ง'
FROM purchase_orders po, storage_locations loc
WHERE po.po_number = 'SC10-6907-0003' AND loc.name = 'หน่วยกรุงเทพ';

-- receipt line: cement 60 received / 60 accepted / good
INSERT INTO receipt_lines (receipt_id, po_item_id, received_qty, accepted_qty, rejected_qty, condition, return_to_supplier)
SELECT r.id, poi.id, 60, 60, 0, 'good', FALSE
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN po_items poi ON poi.po_id = po.id
JOIN items i ON i.id = poi.item_id
WHERE po.po_number = 'SC10-6907-0003' AND i.item_name = 'ปูนซีเมนต์';

-- stock movement: +60 cement receive at หน่วยกรุงเทพ
INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type, ref_id)
SELECT 1, i.id, loc.id, 'receive', 60, 1, 'receipt', r.id
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN storage_locations loc ON loc.id = r.location_id
JOIN items i ON i.item_name = 'ปูนซีเมนต์'
WHERE po.po_number = 'SC10-6907-0003';

-- ---------------------------------------------------------------------------
-- PO #4  SC10-6907-0004 — PARTIALLY RECEIVED
--   wood partially received (7 of 10 accepted, 1 damaged returned), rest open
-- ---------------------------------------------------------------------------
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0004', 8000, DATE '2026-07-06', 'partially_received', p.id
FROM suppliers s, projects p
WHERE s.name = 'โฮมโปร วัสดุภัณฑ์' AND p.name = 'โครงการ BR69011 ศาลาพุทธคยา';

-- line: ไม้สัก 16 @ 500  (partial arrival)
INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 16, 500, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0004' AND i.item_name = 'ไม้สัก' AND loc.name = 'หน่วยกรุงเทพ';
-- total_cost 8000 = 16*500

INSERT INTO receipts (company_id, purchase_order_id, location_id, received_by, note)
SELECT 1, po.id, loc.id, 1, 'ส่งบางส่วน มีชำรุด 1 ตัว ตีกลับผู้ขาย'
FROM purchase_orders po, storage_locations loc
WHERE po.po_number = 'SC10-6907-0004' AND loc.name = 'หน่วยกรุงเทพ';

-- receipt line: received 8, accepted 7, rejected 1 (damaged, returned)
INSERT INTO receipt_lines (receipt_id, po_item_id, received_qty, accepted_qty, rejected_qty, condition, condition_note, return_to_supplier)
SELECT r.id, poi.id, 8, 7, 1, 'damaged', 'ไม้ 1 ตัวแตกหัก', TRUE
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN po_items poi ON poi.po_id = po.id
JOIN items i ON i.id = poi.item_id
WHERE po.po_number = 'SC10-6907-0004' AND i.item_name = 'ไม้สัก';

-- stock movement: +7 wood accepted (rejected 1 NOT added to stock)
INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type, ref_id)
SELECT 1, i.id, loc.id, 'receive', 7, 1, 'receipt', r.id
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN storage_locations loc ON loc.id = r.location_id
JOIN items i ON i.item_name = 'ไม้สัก'
WHERE po.po_number = 'SC10-6907-0004';

-- ---------------------------------------------------------------------------
-- PO #5  SC10-6907-0005 — RECEIVED (fully, all lines accepted)
-- ---------------------------------------------------------------------------
INSERT INTO purchase_orders (company_id, supplier_id, po_number, total_cost, expected_delivery, status, project_id)
SELECT 1, s.id, 'SC10-6907-0005', 9500, DATE '2026-06-28', 'received', p.id
FROM suppliers s, projects p
WHERE s.name = 'เอส.ซี. สตีล แอนด์ ไพพ์' AND p.name = 'โครงการ BR69022 อาคารสำนักงาน';

-- line A: เหล็กเส้น 10 @ 700
INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 10, 700, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0005' AND i.item_name = 'เหล็กเส้น' AND loc.name = 'หน่วยกรุงเทพ';

-- line B: ท่อ PVC 25 @ 100
INSERT INTO po_items (po_id, item_id, item_qty, price, location)
SELECT po.id, i.id, 25, 100, loc.id
FROM purchase_orders po, items i, storage_locations loc
WHERE po.po_number = 'SC10-6907-0005' AND i.item_name = 'ท่อ PVC' AND loc.name = 'หน่วยกรุงเทพ';
-- total_cost 9500 = 10*700 + 25*100 = 7000 + 2500

INSERT INTO receipts (company_id, purchase_order_id, location_id, received_by, note)
SELECT 1, po.id, loc.id, 1, 'รับครบทุกรายการ สภาพดี'
FROM purchase_orders po, storage_locations loc
WHERE po.po_number = 'SC10-6907-0005' AND loc.name = 'หน่วยกรุงเทพ';

-- receipt lines: both fully accepted, good
INSERT INTO receipt_lines (receipt_id, po_item_id, received_qty, accepted_qty, rejected_qty, condition, return_to_supplier)
SELECT r.id, poi.id, poi.item_qty, poi.item_qty, 0, 'good', FALSE
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN po_items poi ON poi.po_id = po.id
WHERE po.po_number = 'SC10-6907-0005';

-- stock movements: +10 steel, +25 pvc
INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type, ref_id)
SELECT 1, poi.item_id, r.location_id, 'receive', poi.item_qty, 1, 'receipt', r.id
FROM receipts r
JOIN purchase_orders po ON po.id = r.purchase_order_id
JOIN po_items poi ON poi.po_id = po.id
WHERE po.po_number = 'SC10-6907-0005';

-- ---------------------------------------------------------------------------
-- 5. Rebuild stock_levels from all stock_movements (single source of truth)
--    Sums every movement so the running total always matches the ledger.
-- ---------------------------------------------------------------------------
INSERT INTO stock_levels (item_id, location_id, qty)
SELECT item_id, location_id, SUM(qty)
FROM stock_movements
GROUP BY item_id, location_id
ON CONFLICT (item_id, location_id)
DO UPDATE SET qty = EXCLUDED.qty;

COMMIT;

-- =============================================================================
-- Expected result:
--   Purchase Orders:  Open 2 (0001,0002) · Partial 2 (0003,0004) · Received 1 (0005)
--   Stock @ หน่วยกรุงเทพ:  ปูนซีเมนต์ 60 · ไม้สัก 7 · เหล็กเส้น 10 · ท่อ PVC 25
--   (your live receive/withdraw demo then changes these numbers on top)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TEARDOWN (run this block alone to wipe demo data before re-seeding):
--
-- BEGIN;
-- DELETE FROM stock_levels;
-- DELETE FROM stock_movements;
-- DELETE FROM receipt_lines;
-- DELETE FROM receipts;
-- DELETE FROM po_items;
-- DELETE FROM purchase_orders;
-- DELETE FROM items      WHERE company_id = 1;
-- DELETE FROM storage_locations WHERE company_id = 1;
-- DELETE FROM suppliers  WHERE company_id = 1;
-- DELETE FROM projects   WHERE company_id = 1;
-- COMMIT;
-- -----------------------------------------------------------------------------
