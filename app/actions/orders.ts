"use server";

import { createClient } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validations/order";
import { CartItem } from "@/types";
import { revalidatePath } from "next/cache";

interface PlaceOrderInput {
  customerName: string;
  paymentMethod: string;
  notes: string;
  items: CartItem[];
}

export async function placeOrder(input: PlaceOrderInput) {
  // Validate
  const parsed = orderSchema.safeParse({
    customer_name: input.customerName,
    payment_method: input.paymentMethod,
    notes: input.notes,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (!input.items || input.items.length === 0) {
    return { error: "Carrinho vazio. Adicione itens antes de finalizar." };
  }

  const supabase = await createClient();

  // Calculate total server-side (never trust the client)
  const total = input.items.reduce((sum, item) => {
    return sum + (item.product.price + (item.option?.price_modifier ?? 0)) * item.quantity;
  }, 0);

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: input.customerName.trim(),
      payment_method: input.paymentMethod,
      notes: input.notes?.trim() || null,
      total,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error(orderError);
    return { error: "Erro ao criar pedido. Tente novamente." };
  }

  // Insert order items
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    option_id: item.option?.id ?? null,
    quantity: item.quantity,
    unit_price: item.product.price + (item.option?.price_modifier ?? 0),
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error(itemsError);
    // Rollback order
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "Erro ao registrar itens do pedido. Tente novamente." };
  }

  revalidatePath("/admin/orders");

  return { orderId: order.id };
}
