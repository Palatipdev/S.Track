-- =============================================================================
-- SorTrack — Demo seed ADD-ON: stock spread across multiple locations
-- =============================================================================
-- Run this AFTER demo_seed.sql (it reuses the same company, items, and the
-- central/unit locations that script created).
--
-- Purpose for the demo: show the exact thing the SaaS cannot do — leftover
-- stock sitting in DIFFERENT units, visible per location, ready to transfer.
-- The story: "we ordered gold/material, didn't use it all, and can see what's
-- left where — so it can move to another unit instead of re-buying."
--
-- What it adds:
--   - a 2nd unit store:  หน่วยเชียงใหม่
--   - real stock at สโตร์กลาง (central), หน่วยกรุงเทพ, and หน่วยเชียงใหม่
--   - every quantity backed by an `adjust` stock_movement (append-only, honest)
--
-- After running, the Stock page shows non-empty stock at 3 different locations,
-- each with different leftover quantities.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add a second unit store (parent = central สโตร์กลาง)
-- ---------------------------------------------------------------------------
INSERT INTO storage_locations (company_id, parent_storage_id, project_id, name, type)
SELECT 1, sl.id, NULL, 'หน่วยเชียงใหม่', 'unit'
FROM storage_locations sl
WHERE sl.name = 'สโตร์กลาง' AND sl.company_id = 1
  AND NOT EXISTS (
    SELECT 1 FROM storage_locations x
    WHERE x.name = 'หน่วยเชียงใหม่' AND x.company_id = 1
  );

-- ---------------------------------------------------------------------------
-- 2. Seed leftover stock at multiple locations via `adjust` movements.
--    `adjust` = opening-balance / stocktake correction. Append-only, so the
--    audit trail stays honest even for seeded starting stock.
--    ref_type 'seed' marks these as demo opening balances.
-- ---------------------------------------------------------------------------

-- ---- สโตร์กลาง (central) : the high-value holding store --------------------
--   ไม้สัก 40, ปูนซีเมนต์ 100, เหล็กเส้น 25, สว่านไฟฟ้า 5
INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type)
SELECT 1, i.id, loc.id, 'adjust', v.qty, 1, 'seed'
FROM (VALUES
        ('ไม้สัก',      40),
        ('ปูนซีเมนต์',  100),
        ('เหล็กเส้น',   25),
        ('สว่านไฟฟ้า',  5)
     ) AS v(item_name, qty)
JOIN items i ON i.item_name = v.item_name AND i.company_id = 1
JOIN storage_locations loc ON loc.name = 'สโตร์กลาง' AND loc.company_id = 1;

-- ---- หน่วยกรุงเทพ : leftover after a project (this is the "didn't use all") --
--   ไม้สัก 2 (ordered 8, used 6 -> 2 left), สายไฟ THW 30, ท่อ PVC 8
INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type)
SELECT 1, i.id, loc.id, 'adjust', v.qty, 1, 'seed'
FROM (VALUES
        ('ไม้สัก',    2),
        ('สายไฟ THW', 30),
        ('ท่อ PVC',   8)
     ) AS v(item_name, qty)
JOIN items i ON i.item_name = v.item_name AND i.company_id = 1
JOIN storage_locations loc ON loc.name = 'หน่วยกรุงเทพ' AND loc.company_id = 1;

-- ---- หน่วยเชียงใหม่ : a different unit with its own leftover ----------------
--   ปูนซีเมนต์ 15, เหล็กเส้น 4, ท่อ PVC 20
INSERT INTO stock_movements (company_id, item_id, location_id, movement_type, qty, actor_id, ref_type)
SELECT 1, i.id, loc.id, 'adjust', v.qty, 1, 'seed'
FROM (VALUES
        ('ปูนซีเมนต์', 15),
        ('เหล็กเส้น',  4),
        ('ท่อ PVC',    20)
     ) AS v(item_name, qty)
JOIN items i ON i.item_name = v.item_name AND i.company_id = 1
JOIN storage_locations loc ON loc.name = 'หน่วยเชียงใหม่' AND loc.company_id = 1;

-- ---------------------------------------------------------------------------
-- 3. Rebuild stock_levels from ALL movements (receipts from demo_seed + these
--    adjusts), so every location's running total matches its ledger.
-- ---------------------------------------------------------------------------
INSERT INTO stock_levels (item_id, location_id, qty)
SELECT item_id, location_id, SUM(qty)
FROM stock_movements
GROUP BY item_id, location_id
ON CONFLICT (item_id, location_id)
DO UPDATE SET qty = EXCLUDED.qty;

COMMIT;

-- =============================================================================
-- Expected Stock page after this add-on:
--
--   สโตร์กลาง:      ไม้สัก 40 · ปูนซีเมนต์ 100 · เหล็กเส้น 25 · สว่านไฟฟ้า 5
--   หน่วยกรุงเทพ:   ปูนซีเมนต์ 60 · ไม้สัก 9 (7 received + 2 leftover) ·
--                   เหล็กเส้น 10 · ท่อ PVC 25 · สายไฟ THW 30
--   หน่วยเชียงใหม่: ปูนซีเมนต์ 15 · เหล็กเส้น 4 · ท่อ PVC 20
--
--   Demo point: same item (e.g. ปูนซีเมนต์, เหล็กเส้น, ท่อ PVC) exists at
--   MULTIPLE locations with different leftover qty. Switch the location picker
--   to prove you can see remaining stock per unit — the SaaS can't, and this
--   is what makes unit-to-unit transfer possible in Phase B.
-- =============================================================================
