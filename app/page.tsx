import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { Product, Category } from "@/types";
import { MenuClient } from "@/components/menu/MenuClient";
import { MapPin, Clock, Phone, Mail } from "lucide-react";

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
    <div className="flex flex-col min-h-screen">
      {/* Hero Header — compact & fixed */}
      <header className="relative bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 text-white overflow-hidden select-none">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex items-center gap-4 sm:gap-5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-2xl shrink-0 animate-float">
            <Image 
              src="/yakisoba.svg" 
              alt="YakiHami Logo" 
              fill 
              className="object-contain" 
              priority 
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-lg leading-none">
              YakiHami
            </h1>
            <p className="text-sm sm:text-base font-medium text-white/85 drop-shadow-md mt-0.5 px-2">
              Sabor que vem da chapa!
            </p>
          </div>
        </div>
      </header>


        {/* Menu Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <MenuClient products={products} categories={categories} />
      </main>

      {/* Footer — rich with store info */}
      <footer className="bg-foreground text-white/90 mt-auto pb-28 sm:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10">
                  <Image src="/yakisoba.svg" alt="YakiHami" fill className="object-contain" />
                </div>
                <span className="text-xl font-black text-white">YakiHami</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                O melhor yakisoba da cidade, feito na hora com ingredientes frescos e muito sabor.
              </p>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                Endereço
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                R. Exemplo, 123 — Centro<br />
                Cidade — SP, 01001-000
              </p>
            </div>

            {/* Horário */}
            <div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400" />
                Horário
              </h3>
              <ul className="text-sm text-white/60 space-y-1">
                <li>Terça a Sábado: 18h – 23h</li>
                <li>Domingo: 18h – 22h</li>
                <li className="text-white/40">Segunda: Fechado</li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
                Contato
              </h3>
              <ul className="text-sm text-white/60 space-y-2">
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-orange-400" />
                  (11) 99999-0000
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-orange-400" />
                  contato@yakihami.com
                </li>
              </ul>
              {/* Social icons */}
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="h-9 w-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-colors duration-200" aria-label="Instagram">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-colors duration-200" aria-label="Facebook">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/40">
            <p>
              YakiHami &copy; {new Date().getFullYear()} — Todos os direitos reservados.
            </p>
            <p className="mt-1">
              Desenvolvido por <a href="https://jasko.dev" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-orange-400 transition-colors underline-offset-4 hover:underline">Heitor Jasko</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
