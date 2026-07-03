import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Lazy client: null when unconfigured so the seed catalog lights The Hall
// with zero backend. Refuse to crash — never a dark storefront.
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : (null as any)

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export interface StoreProduct {
  id: string
  name: string
  description: string | null
  price: number          // dollars (generated column: price_cents / 100)
  price_cents: number
  image: string | null   // generated column mirror of image_url
  image_url: string | null
  sizes: string[]
  category: string
  status: 'live' | 'hidden'
  display_order: number
  created_at: string
}

/** Columns that are safe to write (never write generated columns). */
export interface ProductPatch {
  name?: string
  description?: string | null
  price_cents?: number
  image_url?: string | null
  sizes?: string[]
  category?: string
  status?: 'live' | 'hidden'
  display_order?: number
}

import { SEED_PRODUCTS } from '../data/products'

/** Seed catalog mapped to StoreProduct so The Hall lights up with zero backend. */
function seedAsStoreProducts(): StoreProduct[] {
  return SEED_PRODUCTS.filter(p => p.active).map((p, i) => ({
    id: p.id,
    name: p.name,
    description: p.line,
    price: p.priceCents / 100,
    price_cents: p.priceCents,
    image: p.image,
    image_url: p.image,
    sizes: p.variants.map(v => v.label),
    category: p.kind,
    status: 'live' as const,
    display_order: i,
    created_at: new Date().toISOString(),
  }))
}

export async function fetchProducts(includeHidden: boolean): Promise<StoreProduct[]> {
  // No backend configured -> seed catalog. The store never opens dark.
  if (!supabaseConfigured) return seedAsStoreProducts()
  let q = supabase
    .from('store_products')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (!includeHidden) q = q.eq('status', 'live')
  const { data, error } = await q
  if (error) throw error
  // Configured but table empty (SQL not run yet) -> seed catalog for shoppers.
  if (!data || data.length === 0) return includeHidden ? [] : seedAsStoreProducts()
  return data as StoreProduct[]
}

export async function updateProduct(id: string, patch: ProductPatch): Promise<void> {
  const { error } = await supabase.from('store_products').update(patch).eq('id', id)
  if (error) throw error
}

export async function insertProduct(patch: ProductPatch): Promise<StoreProduct> {
  const { data, error } = await supabase
    .from('store_products')
    .insert(patch)
    .select('*')
    .single()
  if (error) throw error
  return data as StoreProduct
}

/** Persist a full window ordering in one round trip per row (small N). */
export async function saveOrder(ids: string[]): Promise<void> {
  const updates = ids.map((id, i) =>
    supabase.from('store_products').update({ display_order: i }).eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) throw failed.error
}
