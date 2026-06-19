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

  const paymentStatus = options.paymentStatus?.toLowerCase() || "pending";
  const statusLabel =
    paymentStatus === "paid" || paymentStatus === "authorized"
      ? "Pago"
      : "Em aberto";

  url.searchParams.set("paymentStatus", paymentStatus);
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
