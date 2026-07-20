// src/lib/data.ts
// Supabase-backed replacement for the localStorage functions in store.ts.
// CRITICAL DESIGN CHOICE: these return the SAME shapes (Product, Order) the
// UI already uses, so Store.tsx / Cart.tsx / Admin.tsx don't need rewriting —
// only the data SOURCE changes (localStorage -> Supabase). The functions are
// async now (network), which is the one real change the context must absorb.

import { supabase } from '@/lib/supabase';
import type {
  Product,
  ProductSize,
  ProductType,
  ProductStatus,
  Order,
  OrderStatus,
} from '@/lib/store';

// ---- Row shapes coming back from Supabase ----
interface ProductRow {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  product_type: string | null;
  category: string | null;
  image_url: string | null;
  back_image_url: string | null;
  featured: boolean | null;
  status: string | null;
  printify_product_id: string | null;
  created_at: string | null;
}
interface VariantRow {
  product_id: string;
  size: string;
}

// ---- Map a DB row (+ its sizes) into the UI's Product shape ----
function rowToProduct(row: ProductRow, sizes: ProductSize[]): Product {
  return {
    id: row.id,
    name: row.title,
    description: row.description ?? '',
    price: (row.price_cents ?? 0) / 100, // UI uses dollars
    type: (row.product_type as ProductType) ?? 'Other',
    sizes,
    image: row.image_url ?? '',
    backImage: row.back_image_url || undefined,
    category: row.category ?? 'Misfit Army',
    status: (row.status as ProductStatus) ?? 'draft',
    featured: !!row.featured,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

// ---- PRODUCTS ----
export async function fetchProducts(): Promise<Product[]> {
  const { data: products, error } = await supabase
    .from('store_products')
    .select(
      'id, title, description, price_cents, product_type, category, image_url, back_image_url, featured, status, printify_product_id, created_at',
    )
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchProducts failed:', error.message);
    return [];
  }

  // Pull all sizes for these products in one query, then group.
  const ids = (products ?? []).map((p) => p.id);
  const sizesByProduct = new Map<string, ProductSize[]>();

  if (ids.length) {
    const { data: variants, error: varErr } = await supabase
      .from('store_variants')
      .select('product_id, size')
      .in('product_id', ids);

    if (varErr) console.error('fetchProducts variants failed:', varErr.message);

    for (const v of (variants ?? []) as VariantRow[]) {
      const list = sizesByProduct.get(v.product_id) ?? [];
      list.push(v.size as ProductSize);
      sizesByProduct.set(v.product_id, list);
    }
  }

  return (products as ProductRow[]).map((row) =>
    rowToProduct(row, sizesByProduct.get(row.id) ?? []),
  );
}

// ---- ORDERS (admin view: header rows) ----
interface OrderRow {
  id: string;
  customer_email: string | null;
  amount_total_cents: number;
  status: string | null;
  created_at: string;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_email, amount_total_cents, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchOrders failed:', error.message);
    return [];
  }

  // The admin Order type wants items[]; header view leaves items empty and can
  // be expanded later by joining store_orders on order_id if you want detail.
  return (data as OrderRow[]).map((row) => ({
    id: row.id,
    items: [],
    email: row.customer_email ?? '',
    total: (row.amount_total_cents ?? 0) / 100,
    status: (row.status as OrderStatus) ?? 'pending',
    createdAt: row.created_at,
  }));
}

export async function updateOrderStatusDb(id: string, status: OrderStatus) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) console.error('updateOrderStatus failed:', error.message);
  return !error;
}

// ---- CHECKOUT: hand the cart to the server function, which computes real
//      prices from the DB and returns a Stripe URL. The client sends only
//      product_id/size/quantity — never prices. ----
export async function startCheckout(
  items: Array<{ product_id: string; size: string; quantity: number }>,
): Promise<string | null> {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('checkout error:', data?.error);
      alert(data?.error || 'Checkout failed. Please try again.');
      return null;
    }
    return data.url as string;
  } catch (e) {
    console.error('checkout network error:', e);
    alert('Could not reach checkout. Check your connection.');
    return null;
  }
}
