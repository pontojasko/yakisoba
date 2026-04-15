<p align="center">
  <img src="public/yakisoba.svg" width="100" alt="YakiHami Logo" />
</p>

<h1 align="center">Yakisoba</h1>

<p align="center">
  A point-of-sale system for restaurants.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## What is this

Yakisoba is a full-stack ordering system designed for a small yakisoba restaurant. Customers browse the menu on their phone, pick what they want, choose between pickup or delivery, and place their order. On the other side, the kitchen staff sees incoming orders on a kanban board that updates in real time.

---

## How it works

**For customers:**

The homepage is the digital menu. Products are loaded from Supabase, grouped by category, and displayed with images and variant options (size, protein choice, etc). Customers add items to a cart, proceed to checkout, and fill out their name, delivery preference, and payment method. If they choose delivery, the system geocodes their address using OpenStreetMap's Nominatim API and calculates the freight cost based on Haversine distance to the store, using configurable pricing zones.

**For the kitchen:**

The admin dashboard (`/admin`) is behind Supabase Auth. Orders appear in three columns — pending, preparing, and ready — and move between them with a single click. The dashboard also handles product CRUD, order history, store location settings, delivery zone pricing, and thermal receipt printing (80mm format).

---

## Stack

| Layer | What |
|---|---|
| Framework | Next.js 16 with App Router and Server Actions |
| Database | Supabase (Postgres, Auth, Realtime, Storage) |
| Styling | Tailwind CSS 4, shadcn/ui |
| Client state | Zustand for the cart, TanStack Query for server state |
| Forms | React Hook Form + Zod validation |
| Testing | Vitest + Testing Library |

---

## Project layout

```
app/
  actions/            server actions for orders, freight, settings
  admin/              dashboard, menu management, order history, settings
  auth/               login
  checkout/           checkout flow
  confirmacao/[id]/   order confirmation
  page.tsx            public menu

components/
  admin/              order cards, receipt printer, product form, sidebar
  menu/               menu client, product cards, cart drawer, category filter
  checkout/           checkout form

hooks/                useCart (zustand store), useOrders (tanstack query + realtime)
lib/                  freight calc, supabase clients, zod schemas, utils
supabase/             sql migrations
```

---

## Security

All tables have Row Level Security enabled. The menu is publicly readable, but order management and product editing require authentication. Admin routes are guarded both in middleware (server-side redirect) and in the layout (double-check with `getUser()`). Order placement and freight calculation happen through Server Actions with Zod validation — nothing price-sensitive runs on the client.

---

## Running locally

You'll need Node 20+ and a Supabase project.

```bash
git clone https://github.com/pontojasko/yakisoba.git
cd yakisoba
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

Set up the database by running these SQL files in your Supabase SQL Editor, in order:

```
supabase/schema.sql
supabase/add_payment_method.sql
supabase/add_delivery_fields.sql
supabase/add_store_settings.sql
```

Then:

```bash
npm run dev
```

Menu lives at `localhost:3000`. Admin dashboard at `localhost:3000/admin`.

---

## Tests

```bash
npm test
```

---

<p align="center">
  Built by <a href="https://jasko.dev">Heitor Jasko</a>
</p>
