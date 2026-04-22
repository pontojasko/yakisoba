import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Order } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido Confirmado | Yakisoba",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConfirmacaoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*, product:products(*), option:product_options(*))")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const o = order as Order;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Success Icon */}
        <div className="flex flex-col items-center text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Pedido Confirmado!</h1>
          <p className="text-muted-foreground text-sm">
            Seu pedido foi recebido e já está sendo preparado.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-2xl border overflow-hidden mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="px-5 py-4 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Pedido de</p>
                <p className="font-semibold">{o.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {formatDate(o.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {o.items?.map((item) => (
              <div
                key={item.id}
                className="px-5 py-3 flex justify-between items-center text-sm"
              >
                <div>
                  <span className="font-medium">{item.product?.name}</span>
                  {item.option && (
                    <span className="text-muted-foreground"> — {item.option.name}</span>
                  )}
                  <span className="text-muted-foreground"> ×{item.quantity}</span>
                </div>
                <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {o.notes && (
            <div className="px-5 py-3 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">Observação:</p>
              <p className="text-sm">{o.notes}</p>
            </div>
          )}

          <div className="px-5 py-4 border-t flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary text-lg">{formatCurrency(o.total)}</span>
          </div>
        </div>

        <Link href="/">
          <Button className="w-full rounded-full" size="lg">Fazer Novo Pedido</Button>
        </Link>
      </div>
    </div>
  );
}
