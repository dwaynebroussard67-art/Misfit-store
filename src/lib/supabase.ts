import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

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
