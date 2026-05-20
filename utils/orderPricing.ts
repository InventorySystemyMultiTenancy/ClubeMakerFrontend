import type { OrderItem } from "../types";

export const formatCurrency = (value: number | null | undefined) =>
  `R$ ${Number(value || 0).toFixed(2)}`;

export const getOrderItemPricingInfo = (item: OrderItem) => {
  const quantity = Number(item.quantity) || 1;
  const unitPrice = Number(item.price) || 0;
  const customUnitPrice = Number(item.customUnitPrice ?? unitPrice);
  const originalUnitPrice = Number(item.originalUnitPrice ?? customUnitPrice);
  const discountPercent = Number(item.discountPercent ?? 0);
  const hasOriginalPrice = originalUnitPrice > customUnitPrice;
  const hasDiscount = discountPercent > 0;
  const hasCustomPrice = customUnitPrice !== unitPrice;

  return {
    quantity,
    unitPrice,
    customUnitPrice,
    originalUnitPrice,
    discountPercent,
    lineTotal: unitPrice * quantity,
    hasPricingDetails: hasOriginalPrice || hasDiscount || hasCustomPrice,
    hasOriginalPrice,
    hasDiscount,
    hasCustomPrice,
  };
};
