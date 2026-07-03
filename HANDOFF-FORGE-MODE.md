# FORGE MODE UPGRADE — HANDOFF (July 2, 2026)

## What changed in this session

The static product grid was replaced with **The Hall**: a dynamic storefront
of display windows, editable in place by the owner. No separate admin page.

### New behavior
- Products render as lit **display windows** ordered by `display_order`.
- **⚒ Owner** link (top right of store) → Supabase email/password sign-in.
- Signed in, a **Forge Mode** toggle appears:
  - **Drag** the ⠿ handle to rearrange windows (mouse + touch). Order persists.
  - **Tap the price plaque** → edit price in place (dollars; stored as cents).
  - **Tap the name** → rename in place.
  - **Tap the artwork** → picker with the 8 shipped designs or a custom URL.
  - **⛧ Shutter / 🕯 Unveil** → hide/show a product (status live/hidden).
  - **New window** tile → adds a product (starts shuttered).
- Customers never see any of this; they see live windows only.

### Files changed
- `src/pages/Store.tsx` — rewritten (windows, drag, inline edit)
- `src/lib/supabase.ts` — rewritten (typed helpers: fetch/update/insert/saveOrder)
- `src/components/OwnerBar.tsx` — NEW (auth + Forge Mode toggle)
- `src/components/ImagePicker.tsx` — NEW (artwork picker)
- `src/styles.css` — hall/window/forge styles appended
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — FIXED
  (previous config had invalid option `useDefineForModuleExports` and no
  `jsx` setting; `npm run build` could not have passed before)
- `src/vite-env.d.ts` — NEW (vite client types; `import.meta.env` typing)
- `src/store/` (legacy zustand module) — REMOVED (imported a function that
  no longer exists; nothing referenced it)

### Database requirements (misfit-store-setup.sql — v2)
- Generated columns `price` (= price_cents/100) and `image` (= image_url)
  bridge the schema↔frontend field-name mismatch with zero code coupling.
- `display_order INTEGER` column + index.
- RLS: anon reads live rows only; `authenticated` role has full
  select/insert/update on `store_products` and read on `store_orders`.
- Seeds 8 products from the original handoff (only if table is empty).

### Owner account (one-time)
Supabase dashboard → Authentication → Users → **Add user** → D's email +
password. Uncheck "send confirmation" / use auto-confirm. That login is what
the ⚒ Owner link accepts. Never put the service-role key in the client.

### Deploy
```bash
git add . && git commit -m "Forge Mode: dynamic hall storefront" && git push
```
Vercel auto-deploys. `npm run build` verified passing in this session.

### Still open (unchanged from original handoff)
- Stripe keys + webhook in Vercel (checkout is wired but unconfigured)
- ntfy topic env var
- Printify integration (optional seam exists in webhook)
- Image mapping: seed uses design-01..08 in handoff-table order — verify
  each product shows the right art; fix via the artwork picker if not.
