export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "One Size";
export type ProductType = "Hoodie" | "T-Shirt" | "Cap" | "Print" | "Other";
export type ProductStatus = "live" | "hidden" | "draft";
export type OrderStatus = "pending" | "completed" | "fulfilled";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ProductType;
  sizes: ProductSize[];
  image: string;
  backImage?: string;
  category: string;
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  size: ProductSize;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  email: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface VaultFile {
  id: string;
  name: string;
  type: "image" | "document" | "other";
  size: string;
  url: string;
  thumb?: string;
  uploadedAt: string;
  category: string;
}

export const PRODUCT_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "One Size"];
export const PRODUCT_TYPES: ProductType[] = ["Hoodie", "T-Shirt", "Cap", "Print", "Other"];
export const PRODUCT_STATUSES: ProductStatus[] = ["live", "hidden", "draft"];
export const ORDER_STATUSES: OrderStatus[] = ["pending", "completed", "fulfilled"];

export const STORAGE_KEYS = {
  products: "misfit_products",
  cart: "misfit_cart",
  orders: "misfit_orders",
  vault: "misfit_vault",
  adminSession: "misfit_admin_session",
} as const;

const APPAREL_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const PREMIUM_HOODIE_SIZES: ProductSize[] = ["S", "M", "L", "XL", "2XL"];
const ONE_SIZE_ONLY: ProductSize[] = ["One Size"];

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const toDataUri = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const slugTone = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 28)
    .toUpperCase();

export function makeProductArtwork(name: string, type: ProductType, accent = "#b8960c", face: "front" | "back" = "front") {
  const label = slugTone(name);
  const panel = face === "front" ? "ARMORY ISSUE" : "REAR MARKING";
  const subtitle = face === "front" ? `MISFIT • ${type}` : "ONE KING • ONE BLOOD • ONE WAR";

  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#090909" />
          <stop offset="48%" stop-color="#111111" />
          <stop offset="100%" stop-color="#1a1408" />
        </linearGradient>
        <linearGradient id="ember" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="#cc2200" />
        </linearGradient>
      </defs>
      <rect width="900" height="1200" rx="34" fill="url(#bg)" />
      <rect x="32" y="32" width="836" height="1136" rx="28" fill="none" stroke="rgba(212,169,30,.62)" stroke-width="3" />
      <path d="M130 130h640M130 1070h640" stroke="rgba(212,169,30,.22)" stroke-width="2" stroke-dasharray="10 18" />
      <path d="M450 180v840M225 600h450" stroke="rgba(255,255,255,.06)" stroke-width="10" stroke-linecap="round" />
      <circle cx="450" cy="600" r="186" fill="rgba(255,255,255,.025)" stroke="rgba(212,169,30,.14)" stroke-width="2" />
      <circle cx="450" cy="600" r="126" fill="none" stroke="url(#ember)" stroke-width="4" />
      <path d="M450 472l28 78h82l-66 48 24 78-68-48-68 48 24-78-66-48h82z" fill="url(#ember)" opacity=".9" />
      <text x="450" y="280" fill="#e8e4dc" font-family="Georgia, serif" font-size="86" text-anchor="middle" letter-spacing="10">${label}</text>
      <text x="450" y="346" fill="${accent}" font-family="Arial, sans-serif" font-size="26" text-anchor="middle" letter-spacing="9">${panel}</text>
      <text x="450" y="930" fill="#d7d2c8" font-family="Georgia, serif" font-size="34" text-anchor="middle" letter-spacing="5">${subtitle}</text>
      <text x="450" y="986" fill="rgba(232,228,220,.72)" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" letter-spacing="7">YOU ARE NOT ALONE</text>
    </svg>
  `);
}

const createdAt = (day: number) => new Date(Date.UTC(2024, 0, day, 12, 0, 0)).toISOString();

const cloneProduct = (product: Product): Product => ({
  ...product,
  sizes: [...product.sizes],
});

export const cloneDefaultProducts = () => DEFAULT_PRODUCTS.map(cloneProduct);

export const defaultSizesForType = (type: ProductType): ProductSize[] => {
  if (type === "Cap" || type === "Print" || type === "Other") {
    return [...ONE_SIZE_ONLY];
  }

  return [...APPAREL_SIZES];
};

export const formatMoney = (value: number) => `$${value.toFixed(2)}`;

export const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p001",
    name: "KHUBA Hoodie",
    description: "A blackout field piece marked for the ones learning how to stand when the war gets close. Weighty, warm, and built for redeemed resistance.",
    price: 49.99,
    type: "Hoodie",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("KHUBA Hoodie", "Hoodie", "#d4a91e"),
    backImage: makeProductArtwork("KHUBA Hoodie", "Hoodie", "#8B0000", "back"),
    category: "Devil's Nightmare Series",
    status: "live",
    featured: true,
    createdAt: createdAt(1),
  },
  {
    id: "p002",
    name: "ONE KING Tee",
    description: "Soft armor for daily witness. Clean command typography up front, a reminder in every thread that no throne outranks the Lamb.",
    price: 24.99,
    type: "T-Shirt",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("ONE KING Tee", "T-Shirt", "#b8960c"),
    category: "Misfit Army",
    status: "live",
    featured: true,
    createdAt: createdAt(2),
  },
  {
    id: "p003",
    name: "DELIVERANCE Hoodie",
    description: "Forged for the testimony after the chains hit the floor. Ember-lined visuals, heavy silhouette, and language pulled straight from rescue.",
    price: 54.99,
    type: "Hoodie",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("DELIVERANCE Hoodie", "Hoodie", "#cc2200"),
    backImage: makeProductArtwork("DELIVERANCE Hoodie", "Hoodie", "#d4a91e", "back"),
    category: "Devil's Nightmare Series",
    status: "live",
    featured: true,
    createdAt: createdAt(3),
  },
  {
    id: "p004",
    name: "GRACE Hoodie",
    description: "For the people who know mercy was never softness. A bone-and-gold layer that wears like a shield for the soul.",
    price: 54.99,
    type: "Hoodie",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("GRACE Hoodie", "Hoodie", "#c4a14f"),
    category: "Devil's Nightmare Series",
    status: "live",
    featured: false,
    createdAt: createdAt(4),
  },
  {
    id: "p005",
    name: "CHAINS BREAKING Hoodie",
    description: "A liberation uniform for the long night. Heavy fleece, hard contrast, and a message that refuses to negotiate with captivity.",
    price: 49.99,
    type: "Hoodie",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("CHAINS BREAKING Hoodie", "Hoodie", "#b54d0f"),
    category: "Liberation Series",
    status: "live",
    featured: false,
    createdAt: createdAt(5),
  },
  {
    id: "p006",
    name: "NURA Emblem Cap",
    description: "A low-profile cap with a high-alert emblem. Everyday coverage for the ones carrying light into places that prefer fog.",
    price: 19.99,
    type: "Cap",
    sizes: [...ONE_SIZE_ONLY],
    image: makeProductArtwork("NURA Emblem Cap", "Cap", "#9b7512"),
    category: "Accessories",
    status: "live",
    featured: false,
    createdAt: createdAt(6),
  },
  {
    id: "p007",
    name: "WAR ROOM Tee",
    description: "A field-ready tee for intercessors, first-watch people, and everyone learning how to fight in prayer before they move in public.",
    price: 24.99,
    type: "T-Shirt",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("WAR ROOM Tee", "T-Shirt", "#d18d14"),
    category: "Misfit Army",
    status: "live",
    featured: false,
    createdAt: createdAt(7),
  },
  {
    id: "p008",
    name: "GUARDIAN ANGEL Cap",
    description: "Structured shade with a warfare-era crest. Built for movement, prayer walks, and the quiet work of covering people well.",
    price: 22.99,
    type: "Cap",
    sizes: [...ONE_SIZE_ONLY],
    image: makeProductArtwork("GUARDIAN ANGEL Cap", "Cap", "#cc7000"),
    category: "Accessories",
    status: "live",
    featured: false,
    createdAt: createdAt(8),
  },
  {
    id: "p009",
    name: "JESUS HOLDS MAN Print",
    description: "Museum-style wall art for houses that want the gospel hanging where fear used to be. Redemption rendered like a rescue report.",
    price: 34.99,
    type: "Print",
    sizes: [...ONE_SIZE_ONLY],
    image: makeProductArtwork("JESUS HOLDS MAN Print", "Print", "#d4a91e"),
    category: "Art Prints",
    status: "live",
    featured: false,
    createdAt: createdAt(9),
  },
  {
    id: "p010",
    name: "BLINDFOLDED MAN Print",
    description: "A contemplative piece about surrender, captivity, and what breaks when grace begins to speak louder than accusation.",
    price: 39.99,
    type: "Print",
    sizes: [...ONE_SIZE_ONLY],
    image: makeProductArtwork("BLINDFOLDED MAN Print", "Print", "#8B0000"),
    category: "Art Prints",
    status: "draft",
    featured: false,
    createdAt: createdAt(10),
  },
  {
    id: "p011",
    name: "MISFIT ARMY Hoodie",
    description: "Heavyweight community issue. A gold-marked layer for the redeemed weirdos still answering the call to gather, cover, and go.",
    price: 54.99,
    type: "Hoodie",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("MISFIT ARMY Hoodie", "Hoodie", "#d4a91e"),
    category: "Misfit Army",
    status: "live",
    featured: true,
    createdAt: createdAt(11),
  },
  {
    id: "p012",
    name: "FIRE & STEEL Tee",
    description: "A lean daily-wear graphic for people forged by pressure. Fire for purification, steel for endurance, Christ over every battle.",
    price: 27.99,
    type: "T-Shirt",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("FIRE & STEEL Tee", "T-Shirt", "#cc2200"),
    category: "Devil's Nightmare Series",
    status: "live",
    featured: false,
    createdAt: createdAt(12),
  },
  {
    id: "p013",
    name: "KHUBA CROSS Print",
    description: "Architectural print work with a redeemed-warfare spine. Best mounted where you need a visual witness stronger than the room.",
    price: 29.99,
    type: "Print",
    sizes: [...ONE_SIZE_ONLY],
    image: makeProductArtwork("KHUBA CROSS Print", "Print", "#b8960c"),
    category: "Art Prints",
    status: "live",
    featured: false,
    createdAt: createdAt(13),
  },
  {
    id: "p014",
    name: "FIRST RESPONDER Tee",
    description: "For the ones who run toward pain because love already ran toward them first. Service-series apparel with a rescue cadence.",
    price: 24.99,
    type: "T-Shirt",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("FIRST RESPONDER Tee", "T-Shirt", "#c6701a"),
    category: "Service Series",
    status: "live",
    featured: false,
    createdAt: createdAt(14),
  },
  {
    id: "p015",
    name: "JESUS LIFTS MAN Hoodie",
    description: "A liberation-layer silhouette centered on the hand of Christ. Thick, solemn, and built to preach without shouting.",
    price: 54.99,
    type: "Hoodie",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("JESUS LIFTS MAN Hoodie", "Hoodie", "#d4a91e"),
    category: "Liberation Series",
    status: "live",
    featured: false,
    createdAt: createdAt(15),
  },
  {
    id: "p016",
    name: "EMBER Cap",
    description: "A warm-toned accessory for quiet fire carriers. Minimal, sharp, and ready for late-night prayer walks and early-morning rebuilds.",
    price: 22.99,
    type: "Cap",
    sizes: [...ONE_SIZE_ONLY],
    image: makeProductArtwork("EMBER Cap", "Cap", "#cc2200"),
    category: "Accessories",
    status: "draft",
    featured: false,
    createdAt: createdAt(16),
  },
  {
    id: "p017",
    name: "BLOOD & BONE Tee",
    description: "A stark service garment about mortality, covenant, and the only bloodline that can restore the family of God.",
    price: 24.99,
    type: "T-Shirt",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("BLOOD & BONE Tee", "T-Shirt", "#8B0000"),
    category: "Misfit Army",
    status: "draft",
    featured: false,
    createdAt: createdAt(17),
  },
  {
    id: "p018",
    name: "NURA VAULT Premium Hoodie",
    description: "A heavier vault-exclusive cut with a cleaner line and tighter release window. Premium stock for the people who stay watchful.",
    price: 64.99,
    type: "Hoodie",
    sizes: [...PREMIUM_HOODIE_SIZES],
    image: makeProductArtwork("NURA VAULT Premium Hoodie", "Hoodie", "#d4a91e"),
    category: "Vault Exclusives",
    status: "live",
    featured: true,
    createdAt: createdAt(18),
  },
  {
    id: "p019",
    name: "COMMUNITY TOTE",
    description: "A carryall for scripture, notebooks, groceries, and the practical mercy work that rarely gets applause but always matters.",
    price: 18.99,
    type: "Other",
    sizes: [...ONE_SIZE_ONLY],
    image: makeProductArtwork("COMMUNITY TOTE", "Other", "#9d7b2f"),
    category: "Accessories",
    status: "live",
    featured: false,
    createdAt: createdAt(19),
  },
  {
    id: "p020",
    name: "ONE KING KING Hoodie",
    description: "The loudest crown statement in the line. Built for the people who have settled the allegiance question and refuse every counterfeit throne.",
    price: 54.99,
    type: "Hoodie",
    sizes: [...APPAREL_SIZES],
    image: makeProductArtwork("ONE KING KING Hoodie", "Hoodie", "#d4a91e"),
    category: "Misfit Army",
    status: "live",
    featured: true,
    createdAt: createdAt(20),
  },
];

function safeRead<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures.
  }
}

export function getProducts() {
  const fallback = cloneDefaultProducts();
  const products = safeRead<Product[] | null>(STORAGE_KEYS.products, null);

  if (!products || products.length === 0) {
    saveProducts(fallback);
    return fallback;
  }

  return products.map(cloneProduct);
}

export function saveProducts(products: Product[]) {
  safeWrite(STORAGE_KEYS.products, products);
}

export function getCart() {
  return safeRead<CartItem[]>(STORAGE_KEYS.cart, []);
}

export function saveCart(items: CartItem[]) {
  safeWrite(STORAGE_KEYS.cart, items);
}

export function getOrders() {
  return safeRead<Order[]>(STORAGE_KEYS.orders, []);
}

export function saveOrders(orders: Order[]) {
  safeWrite(STORAGE_KEYS.orders, orders);
}

export function addOrder(order: Order) {
  const nextOrders = [order, ...getOrders()];
  saveOrders(nextOrders);
  return nextOrders;
}

export function getVaultFiles() {
  return safeRead<VaultFile[]>(STORAGE_KEYS.vault, []);
}

export function saveVaultFiles(files: VaultFile[]) {
  safeWrite(STORAGE_KEYS.vault, files);
}

const getAdminPassword = () => {
  const configuredPassword = import.meta.env.VITE_ADMIN_PASSWORD?.trim();
  return configuredPassword && configuredPassword.length > 0 ? configuredPassword : "armory-local";
};

export function adminLogin(password: string) {
  const success = password === getAdminPassword();

  if (success && canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEYS.adminSession, "active");
  }

  return success;
}

export function adminLogout() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.adminSession);
}

export function isAdminLoggedIn() {
  if (!canUseStorage()) {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEYS.adminSession) === "active";
}

export function isAdminPasswordConfigured() {
  return Boolean(import.meta.env.VITE_ADMIN_PASSWORD?.trim());
}
