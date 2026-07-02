# Misfit Store — Deployment & Setup

## Files Changed / Created

**New**: `/misfit-store/` — Complete standalone storefront
- `src/` — React/TypeScript components
- `api/checkout.ts` — Vercel serverless Stripe checkout
- `.env.example` — Environment template
- `package.json`, `tsconfig.json`, `vite.config.ts` — Config

## Step 1: Create Supabase Table

Run this SQL in your Supabase dashboard (same project as Misfit main):

```sql
create table store_products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric(10,2) not null,
  image text not null,
  sizes text[] default array['S', 'M', 'L', 'XL', 'XXL'],
  description text,
  status text default 'draft' check (status in ('draft', 'live', 'archived')),
  created_at timestamp default now()
);

-- Row-level security (optional but recommended)
alter table store_products enable row level security;

-- Allow public read for 'live' products
create policy "public_live_products" on store_products for select 
  using (status = 'live');
```

## Step 2: Prepare Environment Variables

Copy these from your main Misfit project's Supabase console:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Get Stripe keys from https://dashboard.stripe.com/apikeys:
- STRIPE_SECRET_KEY (restricted key with Checkout access)
- STRIPE_PUBLISHABLE_KEY

## Step 3: Deploy to Vercel

1. Push this folder to GitHub under `dwaynebroussard67-art/misfit-store`
2. In Vercel dashboard:
   - New Project → Import Git Repo
   - Select `misfit-store`
   - Add env vars from `.env.example`
   - Deploy

Result: `https://misfit-store.vercel.app`

## Step 4: Add Store Link to Main Site

In `misfit_ministries/src/components/Nav.tsx`, add:

```tsx
<NavLink to="/store" className={({ isActive }) => isActive ? 'active' : ''}>
  Store
</NavLink>
```

Then in `src/App.tsx` routing, add:

```tsx
<Route path="/store" element={<a href="https://misfit-store.vercel.app" target="_blank">Store</a>} />
```

Or embed an iframe if you want it on-site (not recommended for checkout UX).

## Step 5: Manage Products (No Code)

Go to Supabase → Editor → `store_products` table:
- Click "Insert Row"
- Name, Price, Image URL, Sizes, Status (set to 'live')
- Click Save → Product appears on store immediately

Change price? Edit the row. Hide product? Set status to 'draft'.

## Image URLs

Store images as:
- Full-size source files (1600×1600 px, ~100KB)
- Supabase Storage bucket, OR
- Public image URL (Imgur, etc.)

To use Supabase Storage (recommended):
1. Create bucket: `store-images` (public)
2. Upload PNG/JPG
3. Copy URL: `https://your-project.supabase.co/storage/v1/object/public/store-images/hoodie.jpg`
4. Paste into `image` field in `store_products` row

## Stripe Webhook (Optional but Recommended)

For order fulfillment via Printify, set webhook:
1. Stripe Dashboard → Developers → Webhooks
2. Endpoint: `https://misfit-store.vercel.app/api/webhook`
3. Listen for: `checkout.session.completed`
4. Create file: `api/webhook.ts` with order processing logic

For now, you'll receive Stripe email confirmations for each order.

## Troubleshooting

**Products not showing?**
- Check Supabase: Is `status` set to 'live'?
- Check console: VITE_SUPABASE_URL / ANON_KEY correct?

**Checkout fails?**
- Verify STRIPE_SECRET_KEY in Vercel env vars
- Check Stripe dashboard: Is mode 'live' or 'test'?
- Tail logs: `vercel logs` or Vercel dashboard

**Images broken?**
- Verify URL is publicly accessible
- Supabase Storage bucket privacy setting

## Future: Printify Integration

When ready:
1. Get Printify API key from https://printify.com/app/account
2. In `api/webhook.ts`, call Printify API to create order
3. Connect Printify shop to your catalog
4. Fulfillment happens automatically

For now, you'll manually take orders from Stripe or receive them via email.
