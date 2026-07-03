import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : (null as any)

export interface StoreProduct {
  id: string
  name: string
  price: number
  image: string
  sizes: string[]
  description?: string
  status: 'draft' | 'live' | 'archived'
  created_at: string
}

// Fetch products from Supabase; returns null when unconfigured or on error
// so the seed catalog stays in control. Refuse on ambiguity - never wrong-grab.
export async function fetchProductsFromSupabase(): Promise<import('../data/products').Product[] | null> {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      .eq('status', 'live')
      .order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      line: row.description ?? '',
      kind: (row.category === 'print' ? 'Print' : row.category === 'tee' ? 'Tee' : 'Hoodie') as 'Hoodie' | 'Tee' | 'Print',
      image: row.image_url ?? '',
      priceCents: row.price_cents,
      variants: (row.sizes ?? ['S', 'M', 'L', 'XL', '2XL']).map((s: string) => ({
        id: s.toLowerCase(),
        label: s,
        priceCents: row.price_cents,
      })),
      printifyProductId: row.printify_product_id ?? undefined,
      active: true,
    }));
  } catch {
    return null;
  }
}
