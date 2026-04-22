-- Execute no Supabase SQL Editor
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'pickup'
    CHECK (delivery_method IN ('pickup', 'delivery')),
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS freight_cost numeric(10,2) NOT NULL DEFAULT 0;
