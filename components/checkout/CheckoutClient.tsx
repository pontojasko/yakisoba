"use client";

import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  orderSchema,
  OrderFormValues,
  paymentMethodLabels,
  deliveryMethodLabels,
  PAYMENT_METHODS,
  DELIVERY_METHODS,
} from "@/lib/validations/order";
import { placeOrder } from "@/app/actions/orders";
import { getFreightEstimate } from "@/app/actions/freight";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  ChevronRight,
  Banknote,
  CreditCard,
  QrCode,
  CircleDollarSign,
  ShoppingBag,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import type { FreightResult } from "@/lib/freight";

const paymentIcons: Record<string, React.ReactNode> = {
  pix: <QrCode className="h-5 w-5" />,
  debit: <CreditCard className="h-5 w-5" />,
  credit: <CircleDollarSign className="h-5 w-5" />,
  cash: <Banknote className="h-5 w-5" />,
};

const deliveryIcons: Record<string, React.ReactNode> = {
  pickup: <ShoppingBag className="h-5 w-5" />,
  delivery: <Truck className="h-5 w-5" />,
};

export function CheckoutClient() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [freight, setFreight] = useState<FreightResult | null>(null);
  const [isCalculatingFreight, setIsCalculatingFreight] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_name: "",
      payment_method: undefined,
      delivery_method: "pickup",
      delivery_address: "",
      notes: "",
    },
  });

  const selectedPayment = form.watch("payment_method");
  const selectedDelivery = form.watch("delivery_method");
  const deliveryAddress = form.watch("delivery_address");

  const grandTotal = total() + (selectedDelivery === "delivery" ? (freight?.freightCost ?? 0) : 0);

  const handleAddressChange = useCallback((address: string) => {
    form.setValue("delivery_address", address);
    setFreight(null);

    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    if (address.trim().length < 8) return;

    addressDebounceRef.current = setTimeout(async () => {
      setIsCalculatingFreight(true);
      const result = await getFreightEstimate(address);
      setIsCalculatingFreight(false);
      if ("data" in result) {
        setFreight(result.data);
      } else {
        setFreight(null);
      }
    }, 800);
  }, [form]);

  function onSubmit(values: OrderFormValues) {
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio!");
      return;
    }

    if (values.delivery_method === "delivery" && !freight) {
      toast.error("Aguarde o cálculo do frete ou corrija o endereço.");
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        customerName: values.customer_name,
        paymentMethod: values.payment_method,
        deliveryMethod: values.delivery_method,
        deliveryAddress: values.delivery_method === "delivery" ? values.delivery_address : undefined,
        freightCost: values.delivery_method === "delivery" ? (freight?.freightCost ?? 0) : 0,
        notes: values.notes ?? "",
        items,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setIsSuccess(true);
      clearCart();
      router.push(`/confirmacao/${result.orderId}`);
    });
  }

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-6xl">🛒</span>
        <h2 className="text-xl font-semibold">Carrinho vazio</h2>
        <p className="text-muted-foreground text-sm">Volte ao cardápio e adicione itens.</p>
        <Link href="/"><Button className="rounded-full mt-2">← Ver Cardápio</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Cardápio
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="font-semibold text-base">Finalizar Pedido</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Order Summary */}
        <section>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Resumo do Pedido</h2>
          <div className="bg-card rounded-2xl border divide-y overflow-hidden">
            {items.map((item) => {
              const price = item.product.price + (item.option?.price_modifier ?? 0);
              const key = `${item.product.id}::${item.option?.id ?? "base"}`;
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {item.product.image_url ? (
                      <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🍜</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    {item.option && <p className="text-xs text-muted-foreground">{item.option.name}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{item.quantity}×</p>
                    <p className="text-sm font-semibold">{formatCurrency(price * item.quantity)}</p>
                  </div>
                </div>
              );
            })}

            {/* Freight row — shown only when delivery is selected and freight is available */}
            {selectedDelivery === "delivery" && freight && (
              <div className="px-4 py-3 flex justify-between items-center text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  Frete ({freight.label})
                </span>
                <span className="font-medium">{formatCurrency(freight.freightCost)}</span>
              </div>
            )}

            <div className="px-4 py-3 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary text-lg">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </section>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Delivery Method */}
            <section>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Método de Entrega</h2>
              <FormField
                control={form.control}
                name="delivery_method"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        {DELIVERY_METHODS.map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => {
                              field.onChange(method);
                              if (method === "pickup") {
                                setFreight(null);
                                form.setValue("delivery_address", "");
                              }
                            }}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150",
                              selectedDelivery === method
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            <span className={cn(selectedDelivery === method ? "text-primary" : "")}>
                              {deliveryIcons[method]}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{deliveryMethodLabels[method]}</span>
                              {method === "pickup" && (
                                <span className="text-xs opacity-70">Sem taxa</span>
                              )}
                              {method === "delivery" && (
                                <span className="text-xs opacity-70">Taxa calculada</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address field — conditional */}
              {selectedDelivery === "delivery" && (
                <div className="mt-4 space-y-3">
                  <FormField
                    control={form.control}
                    name="delivery_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          Endereço de entrega *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Ex: Rua XV de Novembro, 450, Centro, Barretos"
                              className="h-11 pr-10"
                              value={field.value ?? ""}
                              onChange={(e) => handleAddressChange(e.target.value)}
                            />
                            {isCalculatingFreight && (
                              <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Freight result card */}
                  {freight && !isCalculatingFreight && (
                    <div className="rounded-xl border bg-primary/5 border-primary/20 px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 text-sm space-y-0.5">
                        <p className="font-semibold text-foreground">
                          Frete: {formatCurrency(freight.freightCost)}
                        </p>
                        <p className="text-muted-foreground">
                          Distância estimada: {freight.distanceKm} km ({freight.label})
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Tempo estimado: ~{freight.estimatedMinutes} min
                        </p>
                      </div>
                    </div>
                  )}

                  {deliveryAddress && deliveryAddress.length >= 8 && !freight && !isCalculatingFreight && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Endereço não encontrado. Tente incluir rua, número e bairro.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Forma de Pagamento</h2>
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => field.onChange(method)}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150",
                              selectedPayment === method
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            <span className={cn(selectedPayment === method ? "text-primary" : "")}>
                              {paymentIcons[method]}
                            </span>
                            <span className="font-medium text-sm">{paymentMethodLabels[method]}</span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Customer Info */}
            <section>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Seus Dados</h2>
              <div className="bg-card rounded-2xl border p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Observações <span className="text-muted-foreground font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Alergias, preferências..." className="resize-none" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full gap-2 text-base font-semibold h-12"
              disabled={isPending || (selectedDelivery === "delivery" && isCalculatingFreight)}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Confirmar Pedido{selectedDelivery === "delivery" && freight ? ` · ${formatCurrency(grandTotal)}` : ""}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
