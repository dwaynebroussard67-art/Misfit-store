// ── Misfit Ministries Store — seed catalog ──────────────────────────────
// These products work day one with zero backend. When Supabase is wired
// (see HANDOFF.md), rows in the `products` table override this list.
// Every design here came from D's vault — the same art The Hall displays.

export type ProductVariant = {
  id: string;
  label: string; // e.g. "S", "M", "L", "XL", "2XL"
  priceCents: number;
};

export type Product = {
  id: string;
  name: string;
  line: string; // short scripture-adjacent line under the name
  kind: 'Hoodie' | 'Tee' | 'Print';
  image: string;
  priceCents: number; // base price shown on card
  variants: ProductVariant[];
  // Printify handoff seam — filled in when products are created in Printify.
  printifyProductId?: string;
  active: boolean;
};

const sizes = (base: number, upcharge2xl = 300): ProductVariant[] => [
  { id: 's', label: 'S', priceCents: base },
  { id: 'm', label: 'M', priceCents: base },
  { id: 'l', label: 'L', priceCents: base },
  { id: 'xl', label: 'XL', priceCents: base },
  { id: '2xl', label: '2XL', priceCents: base + upcharge2xl },
];

const printSizes = (base: number): ProductVariant[] => [
  { id: '12x12', label: '12×12', priceCents: base },
  { id: '18x18', label: '18×18', priceCents: base + 1000 },
  { id: '24x24', label: '24×24', priceCents: base + 2000 },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'hoodie-sentinel',
    name: 'The Sentinel Hoodie',
    line: 'He keeps watch over the ones the world forgot.',
    kind: 'Hoodie',
    image: '/images/products/design-01.jpg',
    priceCents: 4500,
    variants: sizes(4500),
    active: true,
  },
  {
    id: 'hoodie-lion',
    name: 'Lion of the Tribe Hoodie',
    line: 'Crowned in fire, gentle with the broken.',
    kind: 'Hoodie',
    image: '/images/products/design-02.jpg',
    priceCents: 4500,
    variants: sizes(4500),
    active: true,
  },
  {
    id: 'tee-grace',
    name: 'Grace Tee',
    line: 'Not earned. Given.',
    kind: 'Tee',
    image: '/images/products/design-03.jpg',
    priceCents: 2800,
    variants: sizes(2800),
    active: true,
  },
  {
    id: 'hoodie-warrior',
    name: 'Kneeling Warrior Hoodie',
    line: 'The strongest thing a fighter does is kneel.',
    kind: 'Hoodie',
    image: '/images/products/design-04.jpg',
    priceCents: 4500,
    variants: sizes(4500),
    active: true,
  },
  {
    id: 'tee-nura',
    name: 'Nura Tee',
    line: 'Fire and light. The word is Aramaic. The warmth is His.',
    kind: 'Tee',
    image: '/images/products/design-05.jpg',
    priceCents: 2800,
    variants: sizes(2800),
    active: true,
  },
  {
    id: 'print-khuba',
    name: 'Khuba Print',
    line: "Love — the kind that descends to find you.",
    kind: 'Print',
    image: '/images/products/design-06.jpg',
    priceCents: 2200,
    variants: printSizes(2200),
    active: true,
  },
  {
    id: 'print-harrowing',
    name: 'The Descent Print',
    line: 'He went all the way down. That is what love does.',
    kind: 'Print',
    image: '/images/products/design-07.jpg',
    priceCents: 2200,
    variants: printSizes(2200),
    active: true,
  },
  {
    id: 'tee-misfit',
    name: 'Misfit Tee',
    line: 'The stone the builders rejected.',
    kind: 'Tee',
    image: '/images/products/design-08.jpg',
    priceCents: 2800,
    variants: sizes(2800),
    active: true,
  },
];

export const fmt = (cents: number) =>
  `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
