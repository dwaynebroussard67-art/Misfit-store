-- MISFIT MINISTRIES STOREFRONT SCHEMA
-- Run in Supabase SQL Editor (no prefixes, paste entire block)

-- Products Table
CREATE TABLE IF NOT EXISTS store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  sizes TEXT[] DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  category TEXT DEFAULT 'apparel',
  status TEXT DEFAULT 'live' CHECK (status IN ('live', 'hidden')),
  printify_product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES store_products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  size TEXT,
  quantity INTEGER DEFAULT 1,
  price_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'fulfilled', 'cancelled')),
  printify_order_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_store_products_status ON store_products(status);
CREATE INDEX IF NOT EXISTS idx_store_products_created ON store_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_email ON store_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_created ON store_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_session ON store_orders(stripe_session_id);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read live products
CREATE POLICY "read_live_products" ON store_products
  FOR SELECT USING (status = 'live');

-- RLS Policy: Service role (webhook) can write orders
CREATE POLICY "insert_orders_webhook" ON store_orders
  FOR INSERT WITH CHECK (TRUE);

-- RLS Policy: Authenticated owner can read/update all
-- (Assumes you have an auth setup with owner email check)
CREATE POLICY "owner_read_all" ON store_products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "owner_read_orders" ON store_orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Function: auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: auto-update on record change
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON store_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON store_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Supabase Storage Bucket: store (for product images)
-- Manual step: In Supabase dashboard → Storage → Create Bucket "store"
-- Set to public (read) + authenticated (write)
