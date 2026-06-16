export const buildReceiptPdfUrl = (
  backendUrl: string,
  orderId: string | number,
  options: { paymentStatus?: string | null } = {},
) => {
  const url = new URL(
    `/api/orders/${orderId}/receipt-pdf`,
    backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`,
  );

  url.searchParams.set("brand", "clubemaker");
  url.searchParams.set("logo", "clubemaker-logo.png");

  const statusLabel =
    options.paymentStatus === "paid" || options.paymentStatus === "authorized"
      ? "Pago"
      : "Pendente";
  url.searchParams.set("paymentStatus", options.paymentStatus || "pending");
  url.searchParams.set("paymentStatusLabel", statusLabel);

  if (typeof window !== "undefined") {
    const logoUrl = new URL("/clubemaker-logo.png", window.location.origin);
    logoUrl.searchParams.set("v", "clubemaker");

    url.searchParams.set("logoUrl", logoUrl.toString());
    url.searchParams.set("pdfLogoUrl", logoUrl.toString());
    url.searchParams.set("clubemakerLogoUrl", logoUrl.toString());
  }

  return url.toString();
};
