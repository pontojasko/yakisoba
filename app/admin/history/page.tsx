"use client";

import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, orderStatusLabel, orderStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { History, ChevronDown, ChevronUp, Printer, Search } from "lucide-react";
import { PrintReceipt } from "@/components/admin/PrintReceipt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { queryKeys } from "@/lib/query-keys";

const DONE_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

async function fetchOrderHistory(): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*, product:products(*), option:product_options(*))")
    .in("status", DONE_STATUSES)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Order[];
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: queryKeys.orders.history(),
    queryFn: fetchOrderHistory,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filtered = orders.filter((o) =>
    o.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Histórico de Pedidos
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{orders.length} pedidos finalizados</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do cliente..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-28 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <Fragment key={order.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <TableCell className="font-medium">{order.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", orderStatusColor(order.status))}>
                        {orderStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Dialog>
                          <DialogTrigger
                            className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Reimprimir Cupom</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center py-2">
                              <PrintReceipt order={order} />
                            </div>
                            <Button className="w-full gap-2" onClick={() => window.print()}>
                              <Printer className="h-4 w-4" />
                              Imprimir
                            </Button>
                          </DialogContent>
                        </Dialog>
                        {expanded === order.id
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded row */}
                  {expanded === order.id && (
                    <TableRow className="bg-muted/40">
                      <TableCell colSpan={5} className="py-3 px-6">
                        <div className="space-y-1">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.quantity}× {item.product?.name}
                                {item.option && ` (${item.option.name})`}
                              </span>
                              <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                            </div>
                          ))}
                          {order.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">Obs: {order.notes}</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
