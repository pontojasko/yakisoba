-- Execute no Supabase SQL Editor
-- Tabela de configurações do sistema (chave-valor)
CREATE TABLE IF NOT EXISTS public.store_settings (
  key   text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- RLS: somente autenticados podem ler/escrever
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_auth_all"
  ON public.store_settings FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Valores padrão
INSERT INTO public.store_settings (key, value) VALUES
  ('store_lat',       '-20.5572'),
  ('store_lng',       '-48.5697'),
  ('store_address',   'Centro, Barretos - SP'),
  ('freight_zone_1_km',   '2'),
  ('freight_zone_1_cost', '5'),
  ('freight_zone_2_km',   '4'),
  ('freight_zone_2_cost', '8'),
  ('freight_zone_3_km',   '7'),
  ('freight_zone_3_cost', '12'),
  ('freight_zone_4_km',   '10'),
  ('freight_zone_4_cost', '15'),
  ('freight_zone_5_km',   '15'),
  ('freight_zone_5_cost', '20'),
  ('freight_zone_max_cost','30')
ON CONFLICT (key) DO NOTHING;
