-- Execute no Supabase SQL Editor para adicionar áreas de entrega

CREATE TABLE IF NOT EXISTS public.delivery_areas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  fee_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Leitura pública de áreas ativas" ON public.delivery_areas
  FOR SELECT USING (active = true);

CREATE POLICY "Admin total" ON public.delivery_areas
  FOR ALL TO authenticated USING (true);

-- Atualização na enumeração de status (se for usar ENUM) ou na CHECK constraint
-- Como os status são processados via TEXT check na migration anterior:
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'));

-- Adicionar tipo de pedido (pickup, delivery, local) e FK para area de entrega
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'local' CHECK (order_type IN ('local', 'pickup', 'delivery'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_area_id uuid REFERENCES public.delivery_areas(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee numeric(10,2) NOT NULL DEFAULT 0.00;
