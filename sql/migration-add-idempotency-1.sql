-- Required for webhook idempotency: without this, a Stripe retry can create
-- a duplicate order. This makes the DB itself reject a second insert for the
-- same Stripe session, which is what the webhook's race guard relies on.

-- Run on the SESSION POOLER (port 5432), not the transaction pooler (6543).

ALTER TABLE orders
  ADD CONSTRAINT orders_stripe_session_id_key UNIQUE (stripe_session_id);

-- If the column doesn't exist yet, add it first:
--   ALTER TABLE orders ADD COLUMN stripe_session_id TEXT;
-- then run the ALTER above.

-- Also confirm these columns exist on `orders` (the webhook inserts them):
--   stripe_session_id   TEXT     (unique, above)
--   customer_email      TEXT
--   amount_total_cents  INTEGER
--   shipping_name       TEXT
--   shipping_address    JSONB    <-- must be jsonb, it stores an address object
--   status              TEXT
