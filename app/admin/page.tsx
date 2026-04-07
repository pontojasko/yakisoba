"use client";

import { useOrders } from "@/hooks/useOrders";
import { OrderCard } from "@/components/admin/OrderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/types";

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "preparing", "ready"];

export default function OrdersPage() {
  const { orders, loading, updateOrderStatus, refetch } = useOrders(ACTIVE_STATUSES);

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Pedidos Ativos
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Atualizando em tempo real
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Aguardando
              </h2>
              <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            </div>
            <div className="space-y-3">
              {pending.length === 0 ? (
                <EmptyColumn label="Nenhum pedido aguardando" />
              ) : (
                pending.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={updateOrderStatus}
                  />
                ))
              )}
            </div>
          </div>

          {/* Preparing Column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Preparando
              </h2>
              <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {preparing.length}
              </span>
            </div>
            <div className="space-y-3">
              {preparing.length === 0 ? (
                <EmptyColumn label="Nenhum pedido em preparo" />
              ) : (
                preparing.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={updateOrderStatus}
                  />
                ))
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Pronto para Retirada
              </h2>
              <span className="ml-auto bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {ready.length}
              </span>
            </div>
            <div className="space-y-3">
              {ready.length === 0 ? (
                <EmptyColumn label="Nenhum pedido pronto" />
              ) : (
                ready.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={updateOrderStatus}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed rounded-2xl p-6 text-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}
