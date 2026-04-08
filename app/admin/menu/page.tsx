"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Product, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Image from "next/image";
import { queryKeys } from "@/lib/query-keys";
import { ProductForm } from "@/components/admin/ProductForm";

const supabase = createClient();

async function fetchMenuData() {
  const [{ data: products, error: pe }, { data: categories, error: ce }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*, category:categories(*), options:product_options(*)")
        .order("created_at"),
      supabase.from("categories").select("*").order("name"),
    ]);

  if (pe) throw pe;
  if (ce) throw ce;

  return {
    products: (products ?? []) as Product[],
    categories: (categories ?? []) as Category[],
  };
}

export default function MenuPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: fetchMenuData,
    staleTime: 60 * 1000, // 1min — menu não muda frequentemente
  });

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];

  const toggleMutation = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase.from("products").update({ available }).eq("id", id);
      if (error) throw error;
    },
    // Optimistic toggle
    onMutate: async ({ id, available }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.list() });
      const previous = queryClient.getQueryData<{ products: Product[]; categories: Category[] }>(queryKeys.products.list());
      queryClient.setQueryData<{ products: Product[]; categories: Category[] }>(
        queryKeys.products.list(),
        (old) => old
          ? { ...old, products: old.products.map((p) => p.id === id ? { ...p, available } : p) }
          : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.products.list(), context.previous);
      toast.error("Erro ao atualizar disponibilidade");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: () => toast.error("Erro ao excluir produto"),
  });

  function handleDelete(product: Product) {
    if (!confirm(`Excluir "${product.name}"?`)) return;
    deleteMutation.mutate(product.id);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            Cardápio
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{products.length} produtos cadastrados</p>
        </div>
        <Button onClick={() => { setIsCreating(true); setEditingProduct(null); }} className="gap-2 rounded-full">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <div className="relative aspect-video bg-muted">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🍜</div>
                )}
                {!product.available && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <Badge variant="secondary">Indisponível</Badge>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                    <p className="text-primary font-bold text-sm mt-1">{formatCurrency(product.price)}</p>
                  </div>
                </div>
                {product.options && product.options.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.options.map((opt) => (
                      <Badge key={opt.id} variant="secondary" className="text-xs">{opt.name}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => toggleMutation.mutate({ id: product.id, available: !product.available })}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {product.available
                      ? <ToggleRight className="h-4 w-4 text-green-500" />
                      : <ToggleLeft className="h-4 w-4" />
                    }
                    {product.available ? "Disponível" : "Indisponível"}
                  </button>
                  <div className="flex gap-1 ml-auto">
                    <Button size="icon-sm" variant="ghost" onClick={() => setEditingProduct(product)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(product)}
                      className="text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Component */}
      <Dialog open={isCreating || editingProduct !== null} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingProduct(null);
        }
      }}>
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <ProductForm
            product={editingProduct}
            categories={categories}
            onClose={() => { setIsCreating(false); setEditingProduct(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
