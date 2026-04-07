"use client";

import { useOrders } from "@/hooks/useOrders";
import { OrderCard } from "@/components/admin/OrderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/types";

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "out_for_delivery"];

export default function OrdersPage() {
  const { orders, loading, updateOrderStatus, refetch } = useOrders(ACTIVE_STATUSES);

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");
  const outForDelivery = orders.filter((o) => o.status === "out_for_delivery");

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
        <div className="flex overflow-x-auto pb-4 gap-6 snap-x">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3 min-w-[280px] w-full snap-start">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex overflow-x-auto pb-6 gap-5 snap-x items-start min-h-[600px] t-kanban">
          {/* Pending Column */}
          <div className="min-w-[280px] w-[300px] shrink-0 bg-sidebar rounded-2xl p-4 flex flex-col gap-3 snap-start border border-sidebar-border shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Aguardando
              </h2>
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {pending.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[80vh] custom-scroll pr-1">
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
          <div className="min-w-[280px] w-[300px] shrink-0 bg-sidebar rounded-2xl p-4 flex flex-col gap-3 snap-start border border-sidebar-border shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Preparando
              </h2>
              <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {preparing.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[80vh] custom-scroll pr-1">
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
          <div className="min-w-[280px] w-[300px] shrink-0 bg-sidebar rounded-2xl p-4 flex flex-col gap-3 snap-start border border-sidebar-border shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Pronto para Retirada
              </h2>
              <span className="ml-auto bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {ready.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[80vh] custom-scroll pr-1">
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

          {/* Out for Delivery Column */}
          <div className="min-w-[280px] w-[300px] shrink-0 bg-sidebar rounded-2xl p-4 flex flex-col gap-3 snap-start border border-sidebar-border shadow-sm opacity-90">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Saiu pra Entrega
              </h2>
              <span className="ml-auto bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {outForDelivery.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[80vh] custom-scroll pr-1">
              {outForDelivery.length === 0 ? (
                <EmptyColumn label="Nenhum motoboy na rua" />
              ) : (
                outForDelivery.map((order) => (
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
    <div className="border border-dashed border-sidebar-border bg-background rounded-xl p-6 text-center text-muted-foreground text-xs font-medium">
      {label}
    </div>
  );
}
