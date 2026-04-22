-- Execute no Supabase SQL Editor para adicionar método de pagamento
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash'
  CHECK (payment_method IN ('pix', 'debit', 'credit', 'cash'));
