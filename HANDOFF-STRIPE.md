# Hall Storefront — Stripe/Printify Handoff

## Status: checkout secured, webhook pending

### DONE (committed)
- `api/checkout.ts` rewritten: prices come from `store_products` in Supabase, NOT the client. Client price is ignored. Closes the penny-purchase hole.
- Redirect URLs fixed (https + session_id on success).
- Order items passed to Stripe as `metadata.items` (JSON array of {product_id, size, quantity}).
- Env vars needed: STRIPE_SECRET_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_BASE_URL (=https://misfit-store.vercel.app).
- `.gitignore` now ignores `.env*` and `.vercel`.
- vite pinned back to ^5 (a stray `npm audit fix --force` had jumped it to 8 and broke the react plugin).
- Type-check clean: `./node_modules/.bin/tsc --noEmit -p tsconfig.app.json`

### NOT DONE — next session
1. `api/stripe-webhook.ts` needs rewriting:
   - RAW BODY: Vercel auto-parses JSON, which breaks `stripe.webhooks.constructEvent`. Must read the raw request body for signature verification to pass.
   - It reads `session.metadata.product_id` etc — but checkout now sends `metadata.items` (an array). Reconcile the two.
   - Fulfillment is written for PRINTFUL's URL but we use PRINTIFY. Rewrite for Printify: POST /v1/shops/{SHOP_ID}/orders.json
   - Add first-fruits: on each paid order, write a fixed ministry % to a tithe ledger (table not created yet).

### PRINTIFY — need before writing webhook
- Fulfillment provider = PRINTIFY (confirmed).
- Need: shop ID, API token (as PRINTIFY_API_KEY env var, never in code).
- Printify orders need VARIANT ID per size, not just product_id. Current schema stores one `printify_product_id` per product + a plain `size` string. Need a size->variant map (hardcode for now, or add store_variants table later).
- Open questions: how many products in the Hall; do we have variant IDs, or pull catalog from Printify API first.

### TEST PLAN (once webhook done)
- Use sk_test_ keys first.
- Register webhook endpoint in Stripe dashboard, event: checkout.session.completed.
- Test purchase -> order row in store_orders -> Printify receives order -> tithe ledger increments.
- Only then swap to live keys.

### PASTE-SAFETY NOTE
Pasting code straight at the `$` prompt runs each line as a shell command (that's what caused the wall of errors). Always paste INSIDE nano, or inside a `<< 'EOF'` heredoc.
