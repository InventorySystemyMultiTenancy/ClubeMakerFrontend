import type { Order } from "../types";

export const EXTERNAL_ORDER_PAYMENT_VALUE = "pedido_feito_por_fora";
export const EXTERNAL_ORDER_PAYMENT_LABEL = "Pedido feito por fora";

export const isExternalOrderPayment = (
  paymentType?: Order["paymentType"],
  paymentMethod?: Order["paymentMethod"],
) =>
  paymentType === EXTERNAL_ORDER_PAYMENT_VALUE ||
  paymentMethod === EXTERNAL_ORDER_PAYMENT_VALUE;

export const getPaymentMethodLabel = (
  order: Pick<Order, "paymentType" | "paymentMethod">,
) => {
  if (isExternalOrderPayment(order.paymentType, order.paymentMethod)) {
    return EXTERNAL_ORDER_PAYMENT_LABEL;
  }

  if (!order.paymentType) return "-";

  if (order.paymentType === "presencial") {
    if (order.paymentMethod === "credit") return "Credito";
    if (order.paymentMethod === "debit") return "Debito";
    if (order.paymentMethod === "pix") return "PIX";
    if (order.paymentMethod === "cheque") return "Cheque";
    if (order.paymentMethod === "boleto") return "Boleto";
    return "Presencial";
  }

  if (order.paymentType === "online") {
    if (order.paymentMethod === "credit") {
      return "Cartao de Credito (Mercado Pago)";
    }
    if (order.paymentMethod === "debit") {
      return "Cartao de Debito (Mercado Pago)";
    }
    if (order.paymentMethod === "pix") return "Pix (Mercado Pago)";
    return "Online (Mercado Pago)";
  }

  if (order.paymentType === "contato") return "Entrar em contato";
  if (order.paymentType === "orcamento") return "Orcamento";

  return order.paymentType;
};
