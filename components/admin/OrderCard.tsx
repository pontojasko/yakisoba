"use client";

import { useState } from "react";
import { Order, OrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatCurrency,
  orderStatusLabel,
  orderStatusColor,
} from "@/lib/utils";
import { paymentMethodLabels } from "@/lib/validations/order";
import { ChevronDown, Printer, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintReceipt } from "./PrintReceipt";

const STATUS_FLOW: Record<OrderStatus, { next: OrderStatus; label: string }[]> =
  {
    pending: [{ next: "preparing", label: "Iniciar Preparo" }],
    preparing: [{ next: "ready", label: "Marcar como Pronto" }],
    ready: [{ next: "delivered", label: "Marcar como Entregue" }],
    delivered: [],
    cancelled: [],
  };

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [printOpen, setPrintOpen] = useState(false);
  const nextActions = STATUS_FLOW[order.status] ?? [];
  const elapsed = Math.floor(
    (Date.now() - new Date(order.created_at).getTime()) / 60000
  );

  return (
    <div
      className={cn(
        "bg-card rounded-2xl border overflow-hidden transition-all duration-200 animate-slide-up",
        order.status === "pending" && "border-yellow-300 shadow-yellow-100/50 shadow-md",
        order.status === "preparing" && "border-blue-300 shadow-blue-100/50 shadow-md"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-base truncate">{order.customer_name}</span>
          <Badge
            variant="outline"
            className={cn("text-xs shrink-0", orderStatusColor(order.status))}
          >
            {orderStatusLabel(order.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            {paymentMethodLabels[order.payment_method] ?? order.payment_method}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {elapsed}min
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1.5">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              <span className="font-semibold text-primary">{item.quantity}×</span>{" "}
              {item.product?.name}
              {item.option && (
                <span className="text-muted-foreground text-xs">
                  {" "}({item.option.name})
                </span>
              )}
            </span>
            <span className="text-muted-foreground">{formatCurrency(item.subtotal)}</span>
          </div>
        ))}

        {order.notes && (
          <div className="mt-2 text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-yellow-800">
            📝 {order.notes}
          </div>
        )}
      </div>

      <Separator />

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <span className="font-bold text-primary">{formatCurrency(order.total)}</span>

        <div className="flex items-center gap-2">
          {/* Print */}
          <Dialog open={printOpen} onOpenChange={setPrintOpen}>
            <DialogTrigger
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Visualizar Cupom</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center py-2">
                <PrintReceipt order={order} />
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                Enviar para Impressora
              </Button>
            </DialogContent>
          </Dialog>

          {/* Status Actions */}
          {nextActions.length > 0 && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onStatusChange(order.id, nextActions[0].next)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {nextActions[0].label}
            </Button>
          )}

          {/* Cancel */}
          {["pending", "preparing"].includes(order.status) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                aria-label="Mais opções"
              >
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onStatusChange(order.id, "cancelled")}
                >
                  Cancelar pedido
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
