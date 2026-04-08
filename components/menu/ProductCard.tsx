"use client";

import { useState } from "react";
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
      <div className="group relative bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-row h-[110px]">
        
        {/* Image — Left, tall */}
        <div
          className="relative shrink-0 w-[110px] h-full overflow-hidden bg-muted cursor-pointer group/img"
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
                sizes="110px"
                onLoad={() => setImgLoaded(true)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity h-5 w-5 drop-shadow-md" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🍜</div>
          )}

          {isPopular && (
            <div className="absolute top-1.5 left-1.5 z-10">
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
        <div className="flex-1 flex flex-col justify-between p-3 min-w-0">
          {/* Top: name + description */}
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-card-foreground leading-tight truncate">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Options */}
          {hasOptions && (
            <div className="mt-1">
              <Select
                value={selectedOption?.id ?? ""}
                onValueChange={handleOptionChange}
              >
                <SelectTrigger className="h-6 text-[11px] w-full bg-muted/40 border-dashed">
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

          {/* Bottom: price + stepper */}
          <div className="flex items-center justify-between gap-1 mt-auto">
            <span className="text-sm font-bold text-primary">
              {formatCurrency(displayPrice)}
            </span>

            {product.available && (
              <div className="shrink-0">
                {cartItem ? (
                  <div className="flex items-center gap-1 bg-muted/40 rounded-full border border-border/40 p-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-background"
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
                      className="rounded-full h-6 w-6 shadow-sm"
                      onClick={handleAdd}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={handleAdd}
                    className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
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
