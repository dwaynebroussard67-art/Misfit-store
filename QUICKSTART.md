# MISFIT STORE — QUICK START

**Status:** Project structure + critical files in place. Ready to build & deploy.

## Files You Need to Know

### Critical Files (Already Created)
- **`schema.sql`** — Supabase tables (store_products, store_orders). Run this first in Supabase SQL editor.
- **`api/checkout.ts`** — Stripe checkout session creator (POST `/api/checkout`)
- **`api/stripe-webhook.ts`** — Webhook handler for order creation + ntfy alerts (NEW)
- **`.env.example`** — All env vars needed (UPDATED with missing vars)
- **`vercel.json`** — Vercel build config + function settings (NEW)
- **`package.json`** — Already has Stripe + React Router + Supabase (UPDATED with deps)

### Existing Components
- `src/pages/Store.tsx` — Product listing (may need updates)
- `src/components/Cart.tsx` — Cart UI (may need updates)
- `src/lib/supabase.ts` — Supabase client config
- `src/lib/types.ts` — TypeScript types
- `api/checkout.ts` — Stripe session creation

## IMMEDIATE NEXT STEPS (For Next Claude)

### 1. Setup (5 min)
```bash
cd ~/misfit-store
npm install
cp .env.example .env.local
# Edit .env.local with real keys
```

### 2. Database (5 min)
- Go to Supabase dashboard → SQL Editor
- Paste entire `schema.sql` file → Execute
- Verify tables exist: `SELECT * FROM store_products;`
- Create storage bucket: Storage → "store" (public read)

### 3. Environment (10 min)
- Get Stripe keys: Stripe Dashboard → Settings → API Keys
- Get Supabase keys: Supabase Dashboard → Settings → API
- Copy into `.env.local`
- Create Stripe webhook: Settings → Webhooks → Add endpoint
  - URL: `https://[storefront-vercel-url]/api/stripe-webhook`
  - Events: `checkout.session.completed`
  - Copy signing secret

### 4. Seed Products (5 min)
**Option A: Supabase Admin**
- Data Studio → store_products → Insert row
- Create ~8 products (see HANDOFF-STORE.md for list)

**Option B: Script** (not yet created, but trivial)
```bash
npm run seed  # Would create products if script exists
```

### 5. Local Test (15 min)
```bash
npm run dev
# Open http://localhost:5173
# Browse /shop
# Try checkout with Stripe test card: 4242 4242 4242 4242
# Check order created in Supabase (store_orders table)
```

### 6. Deploy to Vercel (5 min)
```bash
vercel
# Or if already linked:
vercel --prod
# Set env vars in Vercel dashboard
```

### 7. Final Test (10 min)
- Test checkout on live Vercel URL
- Verify webhook fires
- Check ntfy phone alert
- Check order in Supabase

---

## What's Still Missing (Optional)

These are nice-to-haves, not blocking:

- [ ] Admin panel for product CRUD (`src/pages/Admin.tsx` — needs Supabase auth gate)
- [ ] Product image upload to Supabase Storage
- [ ] Seed script for batch product creation
- [ ] Email receipt (integrate SendGrid or Mailgun)
- [ ] Inventory tracking
- [ ] Tax/shipping calculation

---

## Troubleshooting

### Webhook not firing?
1. Check Stripe → Webhooks → Recent events (show failed deliveries)
2. Verify `STRIPE_WEBHOOK_SECRET` matches Endpoint signing secret
3. Logs: Vercel → Deployments → Function logs

### Orders not in Supabase?
1. Check webhook response: should return `{"received": true}`
2. Check Supabase logs for errors
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel env

### Checkout failing?
1. Verify `VITE_STRIPE_PUBLISHABLE_KEY` is in `.env.local` (not `STRIPE_PUBLIC_KEY`)
2. Check browser console for Stripe errors
3. Verify Stripe is in test mode if using test card

---

## Key Design Decisions

1. **No inventory system** — infinite stock (add RLS policy if needed later)
2. **Cart in localStorage** — stateless, no user DB (can add sync later)
3. **Webhook creates orders** — single source of truth is Stripe
4. **ntfy for alerts** — free, real-time phone notifications
5. **Supabase auth for admin** — email/password login (can add OAuth later)

---

## ENV VAR QUICK REFERENCE

```
VITE_SUPABASE_URL              # From Supabase dashboard
VITE_SUPABASE_ANON_KEY         # From Supabase dashboard
SUPABASE_SERVICE_ROLE_KEY      # From Supabase dashboard (for webhook)
STRIPE_SECRET_KEY              # From Stripe dashboard (starts with sk_)
VITE_STRIPE_PUBLISHABLE_KEY    # From Stripe dashboard (starts with pk_)
STRIPE_WEBHOOK_SECRET          # From Stripe → Webhooks → signing secret
NTFY_TOPIC                     # Any string, e.g., "misfit-store-orders"
VITE_STORE_URL                 # Your Vercel storefront URL
```

---

## File Checklist (Do NOT Skip)

- [x] `schema.sql` — Created
- [x] `api/stripe-webhook.ts` — Created
- [x] `vercel.json` — Created
- [x] `.env.example` — Updated
- [x] `package.json` — Updated with deps
- [ ] `.env.local` — **You must create & fill**
- [ ] Supabase migration — **You must run schema.sql**
- [ ] Stripe webhook — **You must configure**
- [ ] Product seed — **You must create products**

---

**Next Claude:** If stuck, check HANDOFF-STORE.md for detailed architecture. This file is the fast-path checklist.
