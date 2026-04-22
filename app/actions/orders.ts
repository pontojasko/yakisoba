"use server";

import { createClient } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validations/order";
import { CartItem } from "@/types";
import { revalidatePath } from "next/cache";

interface PlaceOrderInput {
  customerName: string;
  paymentMethod: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  freightCost?: number;
  notes: string;
  items: CartItem[];
}

interface PlaceOrderErrorResult {
  error: string;
  debugId?: string;
}

interface PlaceOrderSuccessResult {
  orderId: string;
}

function createDebugId() {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function logPlaceOrderError(debugId: string, message: string, details?: unknown) {
  console.error(`[placeOrder:${debugId}] ${message}`, details);
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderErrorResult | PlaceOrderSuccessResult> {
  const debugId = createDebugId();

  // Validate
  const parsed = orderSchema.safeParse({
    customer_name: input.customerName,
    payment_method: input.paymentMethod,
    delivery_method: input.deliveryMethod,
    delivery_address: input.deliveryAddress,
    notes: input.notes,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (!input.items || input.items.length === 0) {
    return { error: "Carrinho vazio. Adicione itens antes de finalizar." };
  }

  try {
    const supabase = await createClient();

    const productIds = [...new Set(input.items.map((item) => item.product.id))];
    const optionIds = [...new Set(input.items.map((item) => item.option?.id).filter(Boolean) as string[])];

    const [{ data: products, error: productsError }, { data: options, error: optionsError }] = await Promise.all([
      supabase.from("products").select("id, price, available").in("id", productIds),
      optionIds.length > 0
        ? supabase.from("product_options").select("id, product_id, price_modifier").in("id", optionIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (productsError) {
      logPlaceOrderError(debugId, "Falha ao consultar produtos", productsError);
      return { error: "Erro ao validar produtos. Tente novamente.", debugId };
    }

    if (optionsError) {
      logPlaceOrderError(debugId, "Falha ao consultar opções de produtos", optionsError);
      return { error: "Erro ao validar opções do pedido. Tente novamente.", debugId };
    }

    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    const optionMap = new Map((options ?? []).map((o) => [o.id, o]));

    let total = 0;
    const computedItems = [] as Array<{
      product_id: string;
      option_id: string | null;
      quantity: number;
      unit_price: number;
    }>;

    for (const item of input.items) {
      const quantity = Number(item.quantity ?? 0);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return { error: "Quantidade inválida no carrinho. Atualize e tente novamente." };
      }

      const product = productMap.get(item.product.id);
      if (!product || !product.available) {
        return { error: "Um item do carrinho não está mais disponível. Atualize o cardápio e tente novamente." };
      }

      let modifier = 0;
      const optionId = item.option?.id ?? null;
      if (optionId) {
        const option = optionMap.get(optionId);
        if (!option || option.product_id !== product.id) {
          return { error: "Uma opção de produto ficou inválida. Atualize o carrinho e tente novamente." };
        }
        modifier = Number(option.price_modifier ?? 0);
      }

      const unitPrice = Number(product.price) + modifier;
      total += unitPrice * quantity;
      computedItems.push({
        product_id: product.id,
        option_id: optionId,
        quantity,
        unit_price: unitPrice,
      });
    }

    let finalFreightCost = 0;
    if (input.deliveryMethod === "delivery") {
      finalFreightCost = Math.max(0, Number(input.freightCost ?? 0));
      
      try {
        const { getStoreSettings } = await import("@/app/actions/settings");
        const { calculateFreight } = await import("@/lib/freight");
        if (input.deliveryAddress) {
          const settings = await getStoreSettings();
          const remoteFreight = await calculateFreight(input.deliveryAddress, settings);
          if (remoteFreight && remoteFreight.freightCost >= 0) {
            finalFreightCost = remoteFreight.freightCost;
          }
        }
      } catch (e) {
        // Fail gracefully and use validated client freight
      }
    }

    const orderId = crypto.randomUUID();

    const { error: orderError } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        customer_name: input.customerName.trim(),
        payment_method: input.paymentMethod,
        delivery_method: input.deliveryMethod,
        delivery_address: input.deliveryAddress?.trim() || null,
        freight_cost: finalFreightCost,
        notes: input.notes?.trim() || null,
        total,
        status: "pending",
      });

    if (orderError) {
      logPlaceOrderError(debugId, "Falha ao criar pedido", orderError);
      return { error: "Erro ao criar pedido. Tente novamente.", debugId };
    }

    const orderItems = computedItems.map((item) => ({
      order_id: orderId,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      logPlaceOrderError(debugId, "Falha ao registrar itens do pedido", itemsError);

      const { error: rollbackError } = await supabase.from("orders").delete().eq("id", orderId);
      if (rollbackError) {
        logPlaceOrderError(debugId, "Falha no rollback do pedido", rollbackError);
      }

      return { error: "Erro ao registrar itens do pedido. Tente novamente.", debugId };
    }

    revalidatePath("/admin");

    return { orderId };
  } catch (error) {
    logPlaceOrderError(debugId, "Erro inesperado ao finalizar pedido", {
      error,
      itemsCount: input.items.length,
      productIds: input.items.map((i) => i.product.id),
    });

    return {
      error: "Erro inesperado ao finalizar pedido. Tente novamente em instantes.",
      debugId,
    };
  }
}
