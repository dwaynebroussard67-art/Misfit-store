import {
  type Order, type OrderStatus, type Product, type VaultFile,
  getVaultFiles, saveVaultFiles,
} from '@/lib/store';
import { fetchProducts, fetchOrders, updateOrderStatusDb } from '@/lib/data';
import { createProductDb, updateProductDb, deleteProductDb } from '@/lib/admin';
import { signIn, signOut, getSession, onAuthChange } from '@/lib/auth';
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';

interface AppDataContextValue {
  products: Product[]; loading: boolean; refreshProducts: () => Promise<void>;
  createProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  orders: Order[]; refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  vaultFiles: VaultFile[];
  addVaultFile: (file: VaultFile) => void; removeVaultFile: (id: string) => void;
  adminLoggedIn: boolean;
  loginAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>(() => getVaultFiles());

  const refreshProducts = useCallback(async () => setProducts(await fetchProducts()), []);
  const refreshOrders = useCallback(async () => setOrders(await fetchOrders()), []);

  useEffect(() => { (async () => {
    setLoading(true);
    await Promise.all([refreshProducts(), refreshOrders()]);
    setLoading(false);
  })(); }, [refreshProducts, refreshOrders]);

  useEffect(() => {
    getSession().then((s) => setAdminLoggedIn(!!s));
    return onAuthChange((s) => setAdminLoggedIn(!!s));
  }, []);

  useEffect(() => { saveVaultFiles(vaultFiles); }, [vaultFiles]);

  const createProduct = useCallback(async (p: Product) => {
    const r = await createProductDb(p);
    if (!r.ok) { alert(`Create failed: ${r.error}`); return; }
    await refreshProducts();
  }, [refreshProducts]);
  const updateProduct = useCallback(async (p: Product) => {
    const r = await updateProductDb(p);
    if (!r.ok) { alert(`Update failed: ${r.error}`); return; }
    await refreshProducts();
  }, [refreshProducts]);
  const deleteProduct = useCallback(async (id: string) => {
    const r = await deleteProductDb(id);
    if (!r.ok) { alert(`Delete failed: ${r.error}`); return; }
    await refreshProducts();
  }, [refreshProducts]);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    if (await updateOrderStatusDb(id, status)) {
      setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  }, []);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const r = await signIn(email, password);
    if (r.ok) { await Promise.all([refreshProducts(), refreshOrders()]); }
    return r;
  }, [refreshProducts, refreshOrders]);
  const logoutAdmin = useCallback(async () => { await signOut(); setAdminLoggedIn(false); }, []);

  const addVaultFile = useCallback((f: VaultFile) => setVaultFiles((c) => [{ ...f }, ...c]), []);
  const removeVaultFile = useCallback((id: string) => setVaultFiles((c) => c.filter((f) => f.id !== id)), []);

  const value = useMemo<AppDataContextValue>(() => ({
    products, loading, refreshProducts, createProduct, updateProduct, deleteProduct,
    orders, refreshOrders, updateOrderStatus, vaultFiles, addVaultFile, removeVaultFile,
    adminLoggedIn, loginAdmin, logoutAdmin,
  }), [products, loading, refreshProducts, createProduct, updateProduct, deleteProduct,
    orders, refreshOrders, updateOrderStatus, vaultFiles, addVaultFile, removeVaultFile,
    adminLoggedIn, loginAdmin, logoutAdmin]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
