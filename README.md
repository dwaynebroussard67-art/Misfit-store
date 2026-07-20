# Misfit Store

"The Hall" storefront — a React + Vite + TypeScript e-commerce site backed by Supabase, with Stripe checkout and Printify fulfillment.

## Stack

- React + TypeScript, bundled with Vite
- Supabase (Postgres + auth) for product data and orders
- Stripe for checkout, Printify for fulfillment
- Deployed on Vercel (serverless functions in `api/`)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase/Stripe keys
npm run dev
```

- `npm run build` — production build
- `npm run preview` — preview the production build locally

## Project layout

- `src/pages` — routed pages (Store, Admin, Vault)
- `src/components` — shared UI components
- `src/lib` — Supabase client, auth, data access
- `api/` — Vercel serverless functions (Stripe checkout + webhook)
- `sql/` — database migrations; `schema.sql` is the base schema

See `HANDOFF-FORGE-MODE.md` and `HANDOFF-STRIPE.md` for the latest session notes on in-place editing ("Forge Mode") and the Stripe/Printify integration status.
