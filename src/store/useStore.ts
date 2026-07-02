import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_PRODUCTS, type Product } from '../data/products';
import { fetchProductsFromSupabase } from '../lib/supabase';

export type CartItem = {
  productId: string;
  variantId: string;
  qty: number;
};

type StoreState = {
  products: Product[];
  cart: CartItem[];
  cartOpen: boolean;
  loadProducts: () => Promise<void>;
  addToCart: (productId: string, variantId: string) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  setQty: (productId: string, variantId: string, qty: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: SEED_PRODUCTS,
      cart: [],
      cartOpen: false,

      loadProducts: async () => {
        // Supabase overrides the seed catalog when configured; seed data
        // keeps the store fully functional without it.
        const remote = await fetchProductsFromSupabase();
        if (remote && remote.length > 0) set({ products: remote });
      },

      addToCart: (productId, variantId) => {
        const cart = [...get().cart];
        const hit = cart.find(
          (c) => c.productId === productId && c.variantId === variantId
        );
        if (hit) hit.qty += 1;
        else cart.push({ productId, variantId, qty: 1 });
        set({ cart, cartOpen: true });
      },

      removeFromCart: (productId, variantId) =>
        set({
          cart: get().cart.filter(
            (c) => !(c.productId === productId && c.variantId === variantId)
          ),
        }),

      setQty: (productId, variantId, qty) => {
        if (qty <= 0) return get().removeFromCart(productId, variantId);
        set({
          cart: get().cart.map((c) =>
            c.productId === productId && c.variantId === variantId
              ? { ...c, qty }
              : c
          ),
        });
      },

      clearCart: () => set({ cart: [] }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
    }),
    {
      name: 'misfit-store-cart',
      partialize: (s) => ({ cart: s.cart }),
    }
  )
);

export const cartCount = (cart: CartItem[]) =>
  cart.reduce((n, c) => n + c.qty, 0);

export const cartTotalCents = (cart: CartItem[], products: Product[]) =>
  cart.reduce((sum, c) => {
    const p = products.find((p) => p.id === c.productId);
    const v = p?.variants.find((v) => v.id === c.variantId);
    return sum + (v?.priceCents ?? 0) * c.qty;
  }, 0);
