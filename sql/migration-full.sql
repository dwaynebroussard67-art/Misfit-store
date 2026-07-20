-- ============================================================
-- THE HALL — schema migration to match the real DB
-- Run on the SESSION POOLER (port 5432), not 6543.
-- Safe to run once. Review before executing.
-- ============================================================

-- 1. ORDERS HEADER (one row per purchase) -------------------
-- Holds the whole-order facts: Stripe session, customer, shipping, total.
CREATE TABLE IF NOT EXISTS orders (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_session_id  TEXT NOT NULL,
    customer_email     TEXT,
    customer_phone     TEXT,
    shipping_name      TEXT,
    shipping_address   JSONB,          -- full Stripe address object
    amount_total_cents INTEGER NOT NULL,
    status             TEXT NOT NULL DEFAULT 'paid',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Idempotency: the webhook relies on this. A Stripe retry cannot
    -- create a second header for the same session.
    CONSTRAINT orders_stripe_session_id_key UNIQUE (stripe_session_id)
);

-- 2. LINK store_orders (line items) TO the header -----------
-- Your existing store_orders stays one-row-per-item. We just add a
-- parent pointer so each item belongs to an order header.
ALTER TABLE store_orders
    ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS store_orders_order_id_idx ON store_orders(order_id);

-- 3. PRODUCTS: add the Printify link -----------------------
ALTER TABLE store_products
    ADD COLUMN IF NOT EXISTS printify_product_id TEXT;

-- 4. VARIANTS: map (product, size) -> Printify variant ------
CREATE TABLE IF NOT EXISTS store_variants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
    size        TEXT NOT NULL,
    variant_id  TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, size)
);

-- 5. TITHE LEDGER: first-fruits cut per order --------------
CREATE TABLE IF NOT EXISTS tithe_ledger (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id           UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tithe_amount_cents INTEGER NOT NULL,
    percentage         NUMERIC(5,2) NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTE on store_orders columns the webhook will write per item:
--   order_id, product_id, product_name, size, quantity, price_cents
-- Confirm product_name/price_cents already exist (they do, per your schema).
-- ============================================================
