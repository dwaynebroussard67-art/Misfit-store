-- ============================================================
-- Fixes store_orders for multi-item carts.
-- Run on the SESSION POOLER (5432). Run AFTER migration-full.sql
-- (which added store_orders.order_id -> orders.id).
--
-- store_orders.stripe_session_id was UNIQUE NOT NULL from the original
-- one-row-per-order schema. Now that one Stripe session can produce
-- several store_orders rows (one per line item, linked via order_id),
-- that constraint rejects every item after the first in any multi-item
-- order. Uniqueness/idempotency now lives on orders.stripe_session_id
-- instead, so this column is no longer needed on store_orders.
-- ============================================================

ALTER TABLE store_orders
  DROP CONSTRAINT IF EXISTS store_orders_stripe_session_id_key;

ALTER TABLE store_orders
  ALTER COLUMN stripe_session_id DROP NOT NULL;
