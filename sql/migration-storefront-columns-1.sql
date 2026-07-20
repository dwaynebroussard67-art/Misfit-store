-- ============================================================
-- Adds the columns the storefront DISPLAYS but the DB didn't hold.
-- Run on the SESSION POOLER (5432). Run AFTER migration-full.sql.
-- ============================================================

ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS description  TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS category     TEXT    DEFAULT 'Misfit Army',
  ADD COLUMN IF NOT EXISTS product_type TEXT    DEFAULT 'T-Shirt',   -- Hoodie | T-Shirt | Cap | Print | Other
  ADD COLUMN IF NOT EXISTS image_url    TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS back_image_url TEXT  DEFAULT '',
  ADD COLUMN IF NOT EXISTS featured     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status       TEXT    DEFAULT 'draft',     -- live | draft | hidden
  ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT now();

-- Sizes are NOT a column here — they live in store_variants (one row per size),
-- which the migration-full.sql created. The storefront's sizes[] is built by
-- reading store_variants for each product.

-- Optional: a public read policy so the storefront's anon key can list products.
-- (Only if RLS is enabled on the table. If RLS is off, skip this.)
--   ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "public can read live products" ON store_products
--     FOR SELECT USING (status = 'live');
