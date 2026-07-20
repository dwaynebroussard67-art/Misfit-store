// src/context/AppDataContext.tsx  (SUPABASE-BACKED)
// Replaces the localStorage version. Products + orders now load from Supabase.
// The UI reads through this context exactly as before, plus a `loading` flag.
import {
  type Order,
  type OrderStatus,
  type Product,
  type VaultFile,
  getVaultFiles,
  saveVaultFiles,
} from '@/lib/store';
import {
  fetchProducts,
  fetchOrders,
  updateOrderStatusDb,
} from '@/lib/data';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface AppDataContextValue {
  products: Product[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  // Vault files stay local for now (uploads are browser-side until Storage lands)
  vaultFiles: VaultFile[];
  addVaultFile: (file: VaultFile) => void;
  removeVaultFile: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>(() => getVaultFiles());

  const refreshProducts = useCallback(async () => {
    const rows = await fetchProducts();
    setProducts(rows);
  }, []);

  const refreshOrders = useCallback(async () => {
    const rows = await fetchOrders();
    setOrders(rows);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([refreshProducts(), refreshOrders()]);
      setLoading(false);
    })();
  }, [refreshProducts, refreshOrders]);

  useEffect(() => {
    saveVaultFiles(vaultFiles);
  }, [vaultFiles]);

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      const ok = await updateOrderStatusDb(id, status);
      if (ok) {
        setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, status } : o)));
      }
    },
    [],
  );

  const addVaultFile = useCallback((file: VaultFile) => {
    setVaultFiles((cur) => [{ ...file }, ...cur]);
  }, []);

  const removeVaultFile = useCallback((id: string) => {
    setVaultFiles((cur) => cur.filter((f) => f.id !== id));
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      products,
      loading,
      refreshProducts,
      orders,
      refreshOrders,
      updateOrderStatus,
      vaultFiles,
      addVaultFile,
      removeVaultFile,
    }),
    [products, loading, refreshProducts, orders, refreshOrders, updateOrderStatus, vaultFiles, addVaultFile, removeVaultFile],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}

/*
  ─────────────────────────────────────────────────────────────
  NOTE — this changes the context's SHAPE in three ways the
  existing components must absorb (all small):

  1. `createOrder` is GONE. The client no longer creates orders —
     the Stripe webhook does, after real payment. Cart.tsx no
     longer calls createOrder (already patched).

  2. Admin product CRUD (createProduct/updateProduct/deleteProduct/
     resetProducts/replaceProducts) is REMOVED from here. Writing
     products now goes to Supabase via authenticated admin calls —
     that's the next file to build (admin write layer + Supabase
     Auth). Until then the Admin "Products" tab is read-only.

  3. Components that read `products` now also get `loading` — show
     a spinner/skeleton while true. Store.tsx should guard on it.
  ─────────────────────────────────────────────────────────────
*/
