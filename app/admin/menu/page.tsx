"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Product, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/lib/validations/product";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  Loader2,
  ToggleLeft,
  ToggleRight,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { queryKeys } from "@/lib/query-keys";

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: fetchMenuData,
    staleTime: 60 * 1000, // 1min — menu não muda frequentemente
  });

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category_id: "",
      available: true,
    },
  });

  function openNew() {
    setEditing(null);
    setImageFile(null);
    setImagePreview(null);
    form.reset({ name: "", description: "", price: "", category_id: "", available: true });
    setSheetOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setImageFile(null);
    setImagePreview(product.image_url);
    form.reset({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      category_id: product.category_id,
      available: product.available,
    });
    setSheetOpen(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("Erro ao fazer upload da imagem"); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      let imageUrl = editing?.image_url ?? null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) throw new Error("Upload falhou");
      }
      const payload = {
        name: values.name,
        description: values.description || null,
        price: parseFloat(values.price),
        category_id: values.category_id,
        available: values.available,
        image_url: imageUrl,
      };
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Produto atualizado!" : "Produto criado!");
      setSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: () => toast.error("Erro ao salvar produto"),
  });

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
            Gerenciar Cardápio
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{products.length} produtos cadastrados</p>
        </div>
        <Button onClick={openNew} className="gap-2 rounded-full">
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
                    <Button size="icon-sm" variant="ghost" onClick={() => openEdit(product)}>
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

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar Produto" : "Novo Produto"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 px-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Imagem</label>
                  <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted mb-2">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-xs">Nenhuma imagem</span>
                      </div>
                    )}
                  </div>
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
                </div>

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl><Input placeholder="Ex: Yakisoba Clássico" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva o prato..." rows={3} className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço base (R$) *</FormLabel>
                    <FormControl><Input type="number" step="0.01" min="0" placeholder="0,00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button
                  type="submit"
                  className="w-full rounded-full gap-2"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Salvar Alterações" : "Criar Produto"}
                </Button>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
