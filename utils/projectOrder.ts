import type { Order } from "../types";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const isProjectOrder = (order: Order) =>
  order.paymentType === "orcamento" || !!order.projectQuote;

export const getProjectOrderDetails = (order: Order) => {
  const quote = order.projectQuote;
  const item = order.items.find((orderItem) => orderItem.projectQuoteId);

  if (!quote && !item) return null;

  return {
    quoteId: quote?.id || item?.projectQuoteId,
    fileName: quote?.fileName || item?.projectFileName || "-",
    hasFile: quote?.hasFile ?? item?.projectHasFile ?? false,
    size: quote?.size || item?.projectSize || "-",
    height: quote?.height || item?.projectHeight || "-",
    width: quote?.width || item?.projectWidth || "-",
    depth: quote?.depth || item?.projectDepth || "-",
    colorQuantity: quote?.colorQuantity || item?.projectColorQuantity || "-",
    colors: quote?.colors || item?.projectColors || "-",
    pieceQuantity: quote?.pieceQuantity || item?.projectPieceQuantity || "-",
    shippingData: quote?.shippingData || item?.projectShippingData || "-",
    deliveryDeadline:
      quote?.deliveryDeadline || item?.projectDeliveryDeadline || "-",
    adminObservation:
      quote?.adminObservation || item?.projectAdminObservation || "",
  };
};

export const downloadProjectOrderFile = (orderId: string) => {
  window.open(`${BACKEND_URL}/api/orders/${orderId}/project-file`, "_blank");
};
