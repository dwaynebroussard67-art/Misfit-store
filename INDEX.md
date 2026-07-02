# MISFIT STORE — FILE INDEX

## Root Config Files

| File | Purpose | Status |
|------|---------|--------|
| `package.json` | npm dependencies + build scripts | ✅ Ready |
| `tsconfig.json` | TypeScript config | ✅ Ready |
| `tsconfig.app.json` | App-specific TS config | ✅ Ready |
| `tsconfig.node.json` | Node TS config (build tools) | ✅ Ready |
| `vite.config.ts` | Vite bundler config | ✅ Ready |
| `vercel.json` | Vercel deployment config + serverless functions | ✅ Created |
| `.env.example` | Environment variables template | ✅ Updated |
| `.env.local` | Actual env vars (GIT IGNORED) | ⚠️ **You must create** |
| `schema.sql` | Supabase database schema | ✅ Created |

## Source Code Structure

### Entry Points
- `src/main.tsx` — React app bootstrap
- `src/App.tsx` — Main router + layout
- `index.html` — HTML entry point

### Pages (in `src/pages/`)
| File | Purpose | Status |
|------|---------|--------|
| `Store.tsx` | Product listing grid | ✅ Exists (may need updates) |
| `ProductDetail.tsx` | Single product page + checkout | ⚠️ Needs creation |
| `Admin.tsx` | Product CRUD + order mgmt | ⚠️ Needs creation |

### Components (in `src/components/`)
| File | Purpose | Status |
|------|---------|--------|
| `Nav.tsx` | Navigation bar | ✅ Exists |
| `Cart.tsx` | Shopping cart UI | ✅ Exists (may need updates) |
| `ProductCard.tsx` | Reusable product card | ⚠️ Needs creation |
| `Checkout.tsx` | Checkout flow | ⚠️ Needs creation |

### Libraries (in `src/lib/`)
| File | Purpose | Status |
|------|---------|--------|
| `supabase.ts` | Supabase client + queries | ✅ Exists |
| `types.ts` | TypeScript interfaces | ✅ Exists |
| `stripe.ts` | Stripe client config | ⚠️ Needs creation |

### State Management (in `src/store/`)
| File | Purpose | Status |
|------|---------|--------|
| `useStore.ts` | Zustand or useState cart state | ✅ Exists |

### Data (in `src/data/`)
| File | Purpose | Status |
|------|---------|--------|
| `products.ts` | Static product seed or fetch | ✅ Exists |

### Serverless Functions (in `api/`)
| File | Purpose | Status |
|------|---------|--------|
| `checkout.ts` | POST `/api/checkout` — create Stripe session | ✅ Exists |
| `stripe-webhook.ts` | POST `/api/stripe-webhook` — handle orders | ✅ Created |

### Styling
- `src/index.css` — Global CSS (or Tailwind setup)
- Palette variables: `--void: #0a0a0a`, `--bone: #e8e4dc`, etc.

### Public Assets
- `public/` — static files (logos, fallback images, favicon)

---

## Database Schema

**File:** `schema.sql`

**Tables:**
1. `store_products` — 8+ product catalog
   - id, name, description, price_cents, image_url, sizes[], status (live/hidden)
   
2. `store_orders` — order history
   - id, stripe_session_id, product_id, customer_email, size, quantity, price_cents, status (pending/completed/fulfilled)

**Indexes:** Created for fast queries (product listing, order lookup)

**Storage Bucket:** `store` — for product images (public read, authenticated write)

---

## Serverless Functions

### `api/checkout.ts`
**Endpoint:** `POST /api/checkout`  
**Input:** `{ items: [{ productId, name, price, size, quantity }] }`  
**Output:** `{ url: string, sessionId: string }`  
**Purpose:** Create Stripe Checkout Session, redirect user to Stripe  

### `api/stripe-webhook.ts`
**Endpoint:** `POST /api/stripe-webhook`  
**Trigger:** Stripe webhook on `checkout.session.completed`  
**Actions:**
1. Verify webhook signature
2. Create order in `store_orders` table
3. Send ntfy phone alert
4. (Optional) Forward to Printify for print-on-demand

---

## Deployment Pipeline

### Local Development
```bash
npm install        # Install deps
npm run dev        # Start dev server
# Test at http://localhost:5173
```

### Build
```bash
npm run build      # Compile TS + bundle with Vite
# Output: dist/
```

### Deploy to Vercel
```bash
vercel            # Link GitHub repo + deploy
vercel --prod     # Push to production
# Functions auto-discovered from api/ folder
```

---

## Environment Variables

**Needed in `.env.local` (dev) and Vercel (prod):**

```
VITE_SUPABASE_URL              # Supabase project URL
VITE_SUPABASE_ANON_KEY         # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY      # Supabase service role (private, for webhook)
STRIPE_SECRET_KEY              # Stripe secret key (private, for webhook)
VITE_STRIPE_PUBLISHABLE_KEY    # Stripe public key (for client)
STRIPE_WEBHOOK_SECRET          # Stripe webhook signing secret (for webhook verification)
NTFY_TOPIC                     # ntfy.sh topic name (for phone alerts)
VITE_STORE_URL                 # Storefront URL (for links from main site)
PRINTIFY_API_KEY               # (Optional) Printify API key for print-on-demand
```

---

## Missing/TODO Files

These need to be created or enhanced:

1. **`src/pages/ProductDetail.tsx`** — Single product page
2. **`src/components/ProductCard.tsx`** — Reusable product card
3. **`src/components/Checkout.tsx`** — Checkout modal/flow
4. **`src/pages/Admin.tsx`** — Admin panel (auth-gated)
5. **`src/lib/stripe.ts`** — Stripe client config (currently in checkout.ts)
6. **`src/components/AdminPanel.tsx`** — Admin CRUD interface

---

## Handoff Documents

| File | Purpose |
|------|---------|
| `HANDOFF-STORE.md` | Comprehensive architecture + build steps |
| `QUICKSTART.md` | Fast-path checklist for next Claude session |
| `INDEX.md` | This file — file-by-file reference |

---

## Key Decisions

1. **Separate Vercel project** — storefront isolated from main site
2. **Supabase backend** — shared auth/DB with main site
3. **Stripe checkout** — not custom, use hosted Stripe Checkout
4. **Orders via webhook** — Stripe is source of truth
5. **ntfy notifications** — free, instant phone alerts on order
6. **localStorage cart** — stateless, can add sync later
7. **Optional Printify** — only triggered if API key present

---

## Testing Checklist

- [ ] Local: `npm run dev` → `/shop` works
- [ ] Local: Product card renders with image
- [ ] Local: Add to cart → stored in localStorage
- [ ] Local: Checkout → Stripe test card (4242 4242 4242 4242)
- [ ] Vercel: Deploy → functions work
- [ ] Vercel: Webhook fires on checkout (check Stripe → Webhooks → Recent events)
- [ ] Supabase: Order created in store_orders table
- [ ] Phone: ntfy alert received after checkout

---

## Quick Links

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **ntfy.sh:** https://ntfy.sh/
- **Printify API Docs:** https://printful.com/api/docs

---

**Last Updated:** July 2, 2026  
**Next Claude:** Use QUICKSTART.md to begin, refer to this INDEX for file details.
