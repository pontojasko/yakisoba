"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, ZoomIn } from "lucide-react";
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

  // Gatilho visual: Mais Pedido (Exemplo base)
  const isPopular = product.name.toLowerCase().includes("tradicional") || product.name.toLowerCase().includes("yakisoba") && product.price > 35;

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
      <div className="group relative bg-card rounded-xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 flex flex-row p-3 gap-3 animate-slide-up">
        {/* Content Left */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-card-foreground leading-tight truncate">
              {product.name}
            </h3>
            {isPopular && (
              <Badge variant="default" className="text-[10px] uppercase font-bold shrink-0 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                Mais pedido
              </Badge>
            )}
          </div>
          
          {product.description && (
            <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Options (if any) */}
          {hasOptions && (
            <div className="mt-2.5">
              <Select
                value={selectedOption?.id ?? ""}
                onValueChange={handleOptionChange}
              >
                <SelectTrigger className="h-8 text-[13px] w-full bg-muted/40 border-dashed">
                  <SelectValue placeholder="Escolha uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {product.options!.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="text-[13px]">
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

          {/* Price & Stepper */}
          <div className="flex items-center justify-between gap-3 mt-auto pt-3">
            <span className="text-[15px] font-bold text-primary">
              {formatCurrency(displayPrice)}
            </span>

            {product.available && (
              <div className="shrink-0">
                {cartItem ? (
                  <div className="flex items-center gap-1.5 bg-muted/30 rounded-full border border-border/50 p-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="rounded-full h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background"
                      onClick={() =>
                        updateQuantity(
                          product.id,
                          selectedOption?.id ?? null,
                          cartItem.quantity - 1
                        )
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-5 text-center font-bold text-sm tabular-nums">
                      {cartItem.quantity}
                    </span>
                    <Button
                      size="icon-sm"
                      className="rounded-full h-7 w-7 shadow-sm"
                      onClick={handleAdd}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAdd}
                    className="gap-1.5 rounded-full px-4 h-8 text-[13px] font-semibold hover:bg-primary hover:text-primary-foreground border-primary/20 text-primary"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Image Right Square */}
        <div className="shrink-0 relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-muted flex items-center justify-center cursor-pointer group/img" onClick={() => { if(product.image_url) setZoomOpen(true) }}>
          {product.image_url ? (
            <>
              {/* Skeleton Screen for fast feeling */}
              {!imgLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse z-0" />
              )}
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className={`object-cover z-10 transition-transform duration-500 group-hover/img:scale-110 ${!imgLoaded ? 'opacity-0' : 'opacity-100'}`}
                sizes="(max-width: 640px) 112px, 112px"
                onLoad={() => setImgLoaded(true)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 z-20 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity h-5 w-5 drop-shadow-md" />
              </div>
            </>
          ) : (
            <div className="text-3xl z-10">🍜</div>
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30">
              <Badge variant="secondary" className="text-[10px] font-bold px-1.5">
                Esgotado
              </Badge>
            </div>
          )}
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
