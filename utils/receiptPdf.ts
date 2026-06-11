export const buildReceiptPdfUrl = (
  backendUrl: string,
  orderId: string | number,
) => {
  const url = new URL(
    `/api/orders/${orderId}/receipt-pdf`,
    backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`,
  );

  url.searchParams.set("brand", "clubemaker");

  return url.toString();
};
