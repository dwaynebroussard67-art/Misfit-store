// src/lib/supabase.ts
// Frontend Supabase client. Uses the ANON / publishable key — safe for the
// browser. This key is NOT the service-role key (that one stays server-side,
// only in the /api functions). Reads here are governed by RLS policies.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Surfaces a clear error instead of silently failing on every query.
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, anonKey);
