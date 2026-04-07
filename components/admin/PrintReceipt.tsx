"use client";

import { useRef } from "react";
import { Order } from "@/types";
import { formatCurrency, formatDate, orderStatusLabel } from "@/lib/utils";
import { paymentMethodLabels } from "@/lib/validations/order";

interface PrintReceiptProps {
  order: Order;
}

export function PrintReceipt({ order }: PrintReceiptProps) {
  return (
    <div
      id="thermal-receipt"
      style={{
        width: "72mm",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "10pt",
        lineHeight: "1.5",
        color: "#000",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <p style={{ fontSize: "14pt", fontWeight: "bold", margin: 0 }}>
          🍜 YAKISOBA
        </p>
        <p style={{ fontSize: "8pt", margin: "2px 0 0" }}>
          Obrigado pela sua visita!
        </p>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* Info */}
      <p style={{ margin: "2px 0" }}>
        <strong>Cliente:</strong> {order.customer_name}
      </p>
      <p style={{ margin: "2px 0" }}>
        <strong>Data:</strong> {formatDate(order.created_at)}
      </p>
      <p style={{ margin: "2px 0" }}>
        <strong>Status:</strong> {orderStatusLabel(order.status)}
      </p>
      <p style={{ margin: "2px 0" }}>
        <strong>Pagamento:</strong>{" "}
        {paymentMethodLabels[order.payment_method] ?? order.payment_method}
      </p>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* Items */}
      <p style={{ margin: "0 0 4px", fontWeight: "bold" }}>ITENS DO PEDIDO</p>
      {order.items?.map((item) => (
        <div
          key={item.id}
          style={{ marginBottom: "4px", breakInside: "avoid" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ maxWidth: "50mm" }}>
              {item.quantity}x {item.product?.name}
              {item.option ? ` (${item.option.name})` : ""}
            </span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        </div>
      ))}

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: "bold",
          fontSize: "12pt",
        }}
      >
        <span>TOTAL</span>
        <span>{formatCurrency(order.total)}</span>
      </div>

      {/* Notes */}
      {order.notes && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <p style={{ margin: "2px 0", fontSize: "9pt" }}>
            <strong>Obs:</strong> {order.notes}
          </p>
        </>
      )}

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
      <p style={{ textAlign: "center", fontSize: "8pt", margin: 0 }}>
        Agradecemos a preferência!
      </p>
    </div>
  );
}

export function usePrint() {
  function printOrder(order: Order) {
    window.print();
  }
  return { printOrder };
}
