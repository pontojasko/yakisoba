-- ============================================================
-- PDV Yakisoba — Supabase SQL Setup
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Extensões
create extension if not exists "uuid-ossp";

-- 2. Tabela: categories
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

-- 3. Tabela: products
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price > 0),
  category_id uuid references public.categories(id) on delete set null,
  image_url   text,
  available   boolean not null default true,
  created_at  timestamptz default now()
);

-- 4. Tabela: product_options (variantes: tamanho, proteína, etc.)
create table if not exists public.product_options (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid references public.products(id) on delete cascade,
  name           text not null,
  price_modifier numeric(10,2) not null default 0,
  created_at     timestamptz default now()
);

-- 5. Tabela: orders
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  status        text not null default 'pending'
                check (status in ('pending','preparing','ready','delivered','cancelled')),
  customer_name text not null,
  notes         text,
  total         numeric(10,2) not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 6. Tabela: order_items
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  option_id  uuid references public.product_options(id) on delete set null,
  quantity   integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  subtotal   numeric(10,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz default now()
);

-- 7. Tabela: profiles (futuro suporte a múltiplos usuários admin)
create table if not exists public.profiles (
  id   uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin'
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.categories     enable row level security;
alter table public.products        enable row level security;
alter table public.product_options enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.profiles        enable row level security;

-- Categories: leitura pública, escrita só para autenticados
create policy "categories_public_read"
  on public.categories for select using (true);

create policy "categories_auth_write"
  on public.categories for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Products: leitura pública (disponíveis), escrita só autenticado
create policy "products_public_read"
  on public.products for select using (true);

create policy "products_auth_write"
  on public.products for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Product options: leitura pública, escrita só autenticado
create policy "product_options_public_read"
  on public.product_options for select using (true);

create policy "product_options_auth_write"
  on public.product_options for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Orders: inserção pública (clientes fazem pedidos), leitura/update só autenticado
create policy "orders_public_insert"
  on public.orders for insert with check (true);

create policy "orders_auth_select"
  on public.orders for select
  using (auth.uid() is not null);

create policy "orders_auth_update"
  on public.orders for update
  using (auth.uid() is not null);

-- Order items: inserção pública, leitura só autenticado
create policy "order_items_public_insert"
  on public.order_items for insert with check (true);

create policy "order_items_auth_select"
  on public.order_items for select
  using (auth.uid() is not null);

-- Profiles: só o próprio usuário
create policy "profiles_own"
  on public.profiles for all
  using (auth.uid() = id);

-- ============================================================
-- Realtime
-- ============================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;

-- ============================================================
-- Storage: bucket para imagens de produtos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_auth_upload"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.uid() is not null);

create policy "product_images_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.uid() is not null);

-- ============================================================
-- Dados de exemplo (opcional, remova se não quiser)
-- ============================================================
insert into public.categories (name) values
  ('Yakisoba'),
  ('Bebidas'),
  ('Entradas')
on conflict do nothing;
