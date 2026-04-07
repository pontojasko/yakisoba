"use client";

import { ShoppingCart, X, Minus, Plus, Trash2, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, total, itemCount, clearCart } =
    useCart();
  const router = useRouter();

  function handleCheckout() {
    onClose();
    router.push("/checkout");
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Seu Pedido
            {itemCount() > 0 && (
              <Badge className="ml-auto text-xs">{itemCount()} itens</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <span className="text-6xl">🛒</span>
            <p className="text-muted-foreground text-sm">
              Seu carrinho está vazio.
              <br />
              Adicione itens do cardápio!
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="py-4 flex flex-col gap-4">
                {items.map((item) => {
                  const price =
                    item.product.price + (item.option?.price_modifier ?? 0);
                  const key = `${item.product.id}::${item.option?.id ?? "base"}`;
                  return (
                    <div key={key} className="flex gap-3 animate-slide-up">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                        {item.product.image_url ? (
                          <Image
                            src={item.product.image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🍜
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight truncate">
                          {item.product.name}
                        </p>
                        {item.option && (
                          <p className="text-xs text-muted-foreground">
                            {item.option.name}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-primary mt-0.5">
                          {formatCurrency(price * item.quantity)}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            className="h-6 w-6 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.option?.id ?? null,
                                item.quantity - 1
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-4 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            className="h-6 w-6 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.option?.id ?? null,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        className="text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                        onClick={() =>
                          removeItem(item.product.id, item.option?.id ?? null)
                        }
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <SheetFooter className="flex-col gap-3 px-6 pt-4 pb-6 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <button
                  onClick={clearCart}
                  className="flex items-center gap-1 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Limpar carrinho
                </button>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total())}</span>
              </div>
              <Button
                onClick={handleCheckout}
                size="lg"
                className="w-full rounded-full gap-2 text-base font-semibold"
              >
                Finalizar Pedido
                <ChevronRight className="h-4 w-4" />
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
