export const buildReceiptPdfUrl = (
  backendUrl: string,
  orderId: string | number,
) => {
  const url = new URL(
    `/api/orders/${orderId}/receipt-pdf`,
    backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`,
  );

  url.searchParams.set("brand", "clubemaker");
  url.searchParams.set("logo", "clubemaker-logo.png");

  if (typeof window !== "undefined") {
    const logoUrl = new URL("/clubemaker-logo.png", window.location.origin);
    logoUrl.searchParams.set("v", "clubemaker");

    url.searchParams.set("logoUrl", logoUrl.toString());
    url.searchParams.set("pdfLogoUrl", logoUrl.toString());
    url.searchParams.set("clubemakerLogoUrl", logoUrl.toString());
  }

  return url.toString();
};
