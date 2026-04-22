"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Minus, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { Product, ProductOption } from "@/types";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    product.options && product.options.length > 0 ? product.options[0] : null
  );
  const [zoomOpen, setZoomOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasOptions = product.options && product.options.length > 0;

  const cartItem = items.find(
    (i) =>
      i.product.id === product.id &&
      (i.option?.id ?? null) === (selectedOption?.id ?? null)
  );

  const displayPrice = product.price + (selectedOption?.price_modifier ?? 0);

  const isPopular =
    product.name.toLowerCase().includes("tradicional") ||
    (product.name.toLowerCase().includes("yakisoba") && product.price > 35);

  function handleAdd() {
    addItem(product, selectedOption);
    toast.success(`${product.name} adicionado!`, {
      description: selectedOption ? `Opção: ${selectedOption.name}` : undefined,
    });
  }

  function handleOptionChange(optionId: string | null) {
    if (!optionId) return;
    const opt = product.options?.find((o) => o.id === optionId) ?? null;
    setSelectedOption(opt);
  }

  return (
    <>
      {/* 
        Desktop: vertical card (image on top, content below)
        Mobile: horizontal card (image left, content right)
      */}
      <div className="product-card group relative bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 flex flex-row sm:flex-col h-[120px] sm:h-auto">
        
        {/* Image */}
        <div
          className="relative shrink-0 w-[120px] sm:w-full h-full sm:h-0 sm:pb-[65%] overflow-hidden bg-muted cursor-pointer group/img"
          onClick={() => { if (product.image_url) setZoomOpen(true); }}
        >
          {product.image_url ? (
            <>
              {!imgLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse z-0" />
              )}
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className={`object-cover transition-transform duration-500 group-hover/img:scale-110 ${!imgLoaded ? "opacity-0" : "opacity-100"}`}
                sizes="(max-width: 640px) 120px, (max-width: 1024px) 50vw, 25vw"
                onLoad={() => setImgLoaded(true)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity h-5 w-5 drop-shadow-md" />
              </div>
            </>
          ) : (
            <div className="w-full h-full sm:absolute sm:inset-0 flex items-center justify-center text-3xl">🍜</div>
          )}

          {isPopular && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="text-[9px] uppercase font-bold px-1.5 py-0 bg-primary text-primary-foreground border-none shadow-sm">
                🔥 Top
              </Badge>
            </div>
          )}

          {!product.available && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
              <Badge variant="secondary" className="text-[10px] font-bold">Esgotado</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 min-w-0">
          {/* Top: name + description */}
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-card-foreground leading-tight truncate">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-[11px] sm:text-xs text-muted-foreground/70 mt-0.5 sm:mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Options */}
          {hasOptions && (
            <div className="mt-1 sm:mt-2">
              <Select
                value={selectedOption?.id ?? ""}
                onValueChange={handleOptionChange}
              >
                <SelectTrigger className="h-6 sm:h-7 text-[11px] w-full bg-muted/40 border-dashed">
                  <SelectValue placeholder="Escolha uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {product.options!.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="text-xs">
                      {opt.name}
                      {opt.price_modifier !== 0 && (
                        <span className="ml-1 text-muted-foreground">
                          {opt.price_modifier > 0 ? "+" : ""}
                          {formatCurrency(opt.price_modifier)}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bottom: price + action button */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-1 sm:pt-2">
            <span className="text-base sm:text-lg font-extrabold text-primary tracking-tight">
              {formatCurrency(displayPrice)}
            </span>

            {product.available && (
              <div className="shrink-0 min-w-[32px]">
                {mounted && cartItem ? (
                  <div className="flex items-center gap-1 bg-muted/40 rounded-full border border-border/40 p-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                      onClick={() =>
                        updateQuantity(product.id, selectedOption?.id ?? null, cartItem.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center font-bold text-xs tabular-nums">
                      {cartItem.quantity}
                    </span>
                    <Button
                      size="icon"
                      className="rounded-full h-7 w-7 shadow-sm"
                      onClick={handleAdd}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={handleAdd}
                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {product.image_url && (
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden border-none bg-transparent shadow-none [&>button]:text-white [&>button]:bg-black/50 [&>button]:hover:bg-black/70 [&>button]:p-2 [&>button]:rounded-full [&>button]:-right-2 [&>button]:-top-2">
            <DialogTitle className="sr-only">Zoom {product.name}</DialogTitle>
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain drop-shadow-2xl"
                sizes="100vw"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
