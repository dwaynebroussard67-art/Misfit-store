import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/store';

function productToRow(p: Product) {
  return {
    title: p.name,
    description: p.description ?? '',
    price_cents: Math.round(p.price * 100),
    product_type: p.type,
    category: p.category,
    image_url: p.image ?? '',
    back_image_url: p.backImage ?? '',
    featured: !!p.featured,
    status: p.status,
    printify_product_id: (p as any).printifyProductId ?? null,
  };
}

async function syncVariants(productId: string, sizes: string[]) {
  const { data: existing } = await supabase
    .from('store_variants').select('size').eq('product_id', productId);
  const have = new Set((existing ?? []).map((r) => r.size.toLowerCase()));
  const want = new Set(sizes.map((s) => s.toLowerCase()));
  const toAdd = sizes.filter((s) => !have.has(s.toLowerCase()));
  const toRemove = [...have].filter((s) => !want.has(s));
  if (toAdd.length) {
    await supabase.from('store_variants').insert(
      toAdd.map((size) => ({ product_id: productId, size, variant_id: '' })));
  }
  if (toRemove.length) {
    await supabase.from('store_variants').delete()
      .eq('product_id', productId).in('size', toRemove);
  }
}

export async function createProductDb(p: Product): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('store_products').insert(productToRow(p)).select('id').single();
  if (error || !data) return { ok: false, error: error?.message };
  await syncVariants(data.id, p.sizes);
  return { ok: true };
}
export async function updateProductDb(p: Product): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('store_products').update(productToRow(p)).eq('id', p.id);
  if (error) return { ok: false, error: error.message };
  await syncVariants(p.id, p.sizes);
  return { ok: true };
}
export async function deleteProductDb(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('store_products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
