"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderStatus } from "@/types";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

async function fetchActiveOrders(statuses: OrderStatus[]): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*, product:products(*), option:product_options(*))")
    .in("status", statuses)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Order[];
}

export function useOrders(statuses: OrderStatus[]) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isFirstLoad = useRef(true);

  const { data: orders = [], isLoading: loading, refetch } = useQuery({
    queryKey: queryKeys.orders.active(statuses),
    queryFn: () => fetchActiveOrders(statuses),
    // Realtime handles updates — no polling needed
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          // Invalidate & refetch on any change
          queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

          if (payload.eventType === "INSERT" && !isFirstLoad.current) {
            toast.info("🍜 Novo pedido recebido!", {
              description: `Cliente: ${(payload.new as Order).customer_name}`,
              duration: 6000,
            });
          }
          isFirstLoad.current = false;
        }
      )
      .subscribe();

    setTimeout(() => { isFirstLoad.current = false; }, 2000);

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Mutation with optimistic update
  const { mutate: updateOrderStatus } = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
    },

    // Optimisticaly update the cache BEFORE the server responds
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.active(statuses) });
      const previous = queryClient.getQueryData<Order[]>(queryKeys.orders.active(statuses));

      queryClient.setQueryData<Order[]>(
        queryKeys.orders.active(statuses),
        (old) => old?.map((o) => o.id === orderId ? { ...o, status } : o) ?? []
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.orders.active(statuses), context.previous);
      }
      toast.error("Erro ao atualizar status");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  return {
    orders,
    loading,
    updateOrderStatus: (orderId: string, status: OrderStatus) =>
      updateOrderStatus({ orderId, status }),
    refetch,
  };
}
