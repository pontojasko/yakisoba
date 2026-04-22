import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finalizar Pedido | Yakisoba",
  description: "Revise seu pedido e informe seus dados para finalizar.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
