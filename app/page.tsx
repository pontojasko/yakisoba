import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { Product, Category } from "@/types";
import { CategoryFilter } from "@/components/menu/CategoryFilter";
import { MenuClient } from "@/components/menu/MenuClient";

export const revalidate = 60;

async function getMenuData() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*), options:product_options(*)")
      .eq("available", true)
      .order("created_at"),
    supabase.from("categories").select("*").order("name"),
  ]);

  return {
    products: (products ?? []) as Product[],
    categories: (categories ?? []) as Category[],
  };
}

export default async function HomePage() {
  const { products, categories } = await getMenuData();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-br from-primary via-brand-600 to-brand-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 drop-shadow-2xl">
            <Image 
              src="/logo.png" 
              alt="YakiHami - Sabor que vem da chapa" 
              fill 
              className="object-contain" 
              priority 
            />
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <MenuClient products={products} categories={categories} />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>YakiHami &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
