"use client";

import { useState, useMemo } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/menu/ProductCard";
import { CategoryFilter } from "@/components/menu/CategoryFilter";
import { CartDrawer } from "@/components/menu/CartDrawer";
import { useCart } from "@/hooks/useCart";
import { Product, Category } from "@/types";

interface MenuClientProps {
  products: Product[];
  categories: Category[];
}

export function MenuClient({ products, categories }: MenuClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount, total } = useCart();

  const filtered = useMemo(
    () =>
      selectedCategory
        ? products.filter((p) => p.category_id === selectedCategory)
        : products,
    [products, selectedCategory]
  );

  const count = itemCount();

  return (
    <>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b -mx-4 px-4 py-3 mb-6 flex items-center gap-3">
        <div className="flex-1 overflow-hidden">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="relative shrink-0 gap-2 rounded-full"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Carrinho</span>
          {count > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {count}
            </Badge>
          )}
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">🍽️</p>
          <p>Nenhum item disponível nesta categoria.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-24">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Floating cart button (mobile - Sticky Footer Style) */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 sm:hidden bg-gradient-to-t from-background via-background to-transparent z-40 pointer-events-none">
          <Button
            onClick={() => setCartOpen(true)}
            size="lg"
            className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 pointer-events-auto flex items-center justify-between px-6 text-base"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-2.5 py-0.5 rounded-md font-bold text-sm">
                {count}
              </div>
              <span className="font-semibold text-white/90">Ver sacola</span>
            </div>
            <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemCount() > 0 ? total() : 0)}</span>
          </Button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
