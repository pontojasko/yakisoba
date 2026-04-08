"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Product, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn, formatCurrency } from "@/lib/utils";
import {
  Camera,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import Image from "next/image";
import { queryKeys } from "@/lib/query-keys";

const supabase = createClient();

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}

export function ProductForm({ product, categories, onClose }: ProductFormProps) {
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);
  const [editingField, setEditingField] = useState<"name" | "description" | "category" | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: String(product?.price || ""),
      category_id: product?.category_id || "",
      available: product?.available ?? true,
    },
  });

  const draftName = form.watch("name");
  const draftDescription = form.watch("description");
  const draftPrice = form.watch("price");
  const draftCategoryId = form.watch("category_id");
  const draftAvailable = form.watch("available");
  const draftCategory = categories.find((cat) => cat.id === draftCategoryId);

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
    if (error) {
      toast.error("Erro ao fazer upload da imagem");
      return null;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      let imageUrl = product?.image_url ?? null;
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
      if (product) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(product ? "Produto atualizado!" : "Produto criado!");
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      onClose();
    },
    onError: () => toast.error("Erro ao salvar produto"),
  });

  return (
    <div className="w-full max-w-2xl mx-auto bg-card rounded-2xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {product ? "Editar Produto" : "Novo Produto"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monte um cardápio atraente com foto, preço e descrição clara.
          </p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-5">
          {/* Preview Card */}
          <div className="rounded-2xl border bg-gradient-to-br from-zinc-900 to-zinc-800 text-white overflow-hidden shadow-sm group relative">
            <div
              className="relative aspect-[16/9] cursor-pointer"
              onClick={() => document.getElementById("product-image-upload")?.click()}
            >
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-300 group-hover:text-zinc-200 transition-colors">
                  <Camera className="h-8 w-8" />
                  <span className="text-xs">Clique para adicionar foto</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            </div>

            {/* Inline Editing Fields */}
            <div className="p-4 space-y-2">
              {/* Category */}
              {editingField === "category" ? (
                <Select
                  value={draftCategoryId !== null ? draftCategoryId : ""}
                  onValueChange={(v) => {
                    if (v) form.setValue("category_id", v);
                    setEditingField(null);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-white/20 border-white/30 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingField("category")}
                  className="mb-2 inline-flex"
                >
                  <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/25 transition-colors">
                    {draftCategory?.name ?? "Clique para categoria"}
                  </Badge>
                </button>
              )}

              {/* Name */}
              {editingField === "name" ? (
                <input
                  type="text"
                  autoFocus
                  value={draftName}
                  onChange={(e) => form.setValue("name", e.target.value)}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                  placeholder="Nome do produto"
                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-lg font-semibold placeholder-zinc-400"
                />
              ) : (
                <button type="button" onClick={() => setEditingField("name")} className="w-full text-left">
                  <p className="font-semibold text-lg leading-tight line-clamp-1 hover:text-amber-200 transition-colors">
                    {draftName?.trim() || "Clique para adicionar nome"}
                  </p>
                </button>
              )}

              {/* Description & Price */}
              <div className="mt-2 flex items-start justify-between gap-2">
                {editingField === "description" ? (
                  <textarea
                    autoFocus
                    value={draftDescription}
                    onChange={(e) => form.setValue("description", e.target.value)}
                    onBlur={() => setEditingField(null)}
                    placeholder="Descrição curta"
                    className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs placeholder-zinc-400 resize-none"
                    rows={2}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingField("description")}
                    className="flex-1 text-left"
                  >
                    <span className="text-zinc-200 line-clamp-2 text-xs hover:text-amber-200 transition-colors">
                      {draftDescription?.trim() || "Clique para adicionar descrição"}
                    </span>
                  </button>
                )}
                <span className="font-bold text-base text-amber-300 shrink-0">
                  {draftPrice ? formatCurrency(Number(draftPrice || 0)) : "R$ 0,00"}
                </span>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Camera className="h-4 w-4 text-primary" />
              Upload de foto
            </div>
            <Input
              id="product-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm"
            />
            {imagePreview && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                Remover foto
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Clique no preview acima para editar nome, descrição e categoria.
            </p>
          </div>

          {/* Price & Status Section */}
          <div className="rounded-2xl border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              Preço e status
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço base (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="h-11 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="available"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status de venda</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                      <button
                        type="button"
                        className={cn(
                          "h-10 rounded-lg text-sm font-medium transition-colors",
                          field.value
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground"
                        )}
                        onClick={() => field.onChange(true)}
                      >
                        Disponível
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "h-10 rounded-lg text-sm font-medium transition-colors",
                          !field.value
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground"
                        )}
                        onClick={() => field.onChange(false)}
                      >
                        Pausado
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Footer */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status atual</span>
              <Badge variant={draftAvailable ? "default" : "secondary"}>
                {draftAvailable ? "Disponível no cardápio" : "Temporariamente indisponível"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={onClose}
                disabled={saveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl gap-2 bg-red-500 hover:bg-red-600 text-white"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {product ? "Salvar alterações" : "Publicar novo produto"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
