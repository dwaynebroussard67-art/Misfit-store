export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export interface StoreProduct {
    id: string;
    name: string;
    description: string | null;
    price: number;
    price_cents: number;
    image: string | null;
    image_url: string | null;
    sizes: string[];
    category: string;
    status: 'live' | 'hidden';
    display_order: number;
    created_at: string;
}
/** Columns that are safe to write (never write generated columns). */
export interface ProductPatch {
    name?: string;
    description?: string | null;
    price_cents?: number;
    image_url?: string | null;
    sizes?: string[];
    category?: string;
    status?: 'live' | 'hidden';
    display_order?: number;
}
export declare function fetchProducts(includeHidden: boolean): Promise<StoreProduct[]>;
export declare function updateProduct(id: string, patch: ProductPatch): Promise<void>;
export declare function insertProduct(patch: ProductPatch): Promise<StoreProduct>;
/** Persist a full window ordering in one round trip per row (small N). */
export declare function saveOrder(ids: string[]): Promise<void>;
