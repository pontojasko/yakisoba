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
      <header className="relative bg-orange-500 text-white overflow-hidden select-none">
        <div className="absolute inset-0 opacity-10"
          
        />
        <div className="relative max-w-5xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 drop-shadow-2xl shrink-0 animate-float scale-125 sm:scale-125 origin-center -ml-2 sm:ml-0">
              <Image 
                src="/yakisoba.svg" 
                alt="YakiHami Logo" 
                fill 
                className="object-contain" 
                priority 
              />
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight drop-shadow-lg leading-none">
                YakiHami
              </h1>
              <p className="text-2xl sm:text-3xl font-medium text-white/90 drop-shadow-md mt-1 px-6">
                Sabor que vem da chapa!
              </p>
            </div>
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
