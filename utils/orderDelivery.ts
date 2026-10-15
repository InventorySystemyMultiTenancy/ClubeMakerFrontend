import type { Order } from "../types";

export interface OrderItemDeliveryProgress {
  index: number;
  name: string;
  productId?: string;
  quantity: number;
  delivered: number;
  lost: number;
  remaining: number;
}

// Progresso de entrega de cada item do pedido, somando todos os eventos de entrega
export function getOrderDeliveryProgress(order: Order): OrderItemDeliveryProgress[] {
  const deliveredByIndex: Record<number, number> = {};
  const lostByIndex: Record<number, number> = {};
  for (const delivery of order.deliveries || []) {
    for (const item of delivery.items) {
      deliveredByIndex[item.index] = (deliveredByIndex[item.index] || 0) + (item.delivered || 0);
      lostByIndex[item.index] = (lostByIndex[item.index] || 0) + (item.lost || 0);
    }
  }

  return order.items.map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const delivered = deliveredByIndex[index] || 0;
    const lost = lostByIndex[index] || 0;
    return {
      index,
      name: item.name,
      productId: item.id || item.productId,
      quantity,
      delivered,
      lost,
      remaining: Math.max(0, quantity - delivered - lost),
    };
  });
}

export function getPendingUnits(order: Order): number {
  return getOrderDeliveryProgress(order).reduce((sum, item) => sum + item.remaining, 0);
}

// Pedidos marcados como entregues antes do controle de entregas não têm deliveryStatus
export function isOrderFullyDelivered(order: Order): boolean {
  return order.deliveryStatus === "delivered" || Boolean(order.entregueCliente);
}
