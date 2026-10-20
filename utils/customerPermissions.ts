import type { CustomerPermission } from "../types";

// Funcionalidades que o admin pode liberar para cada cliente.
// Manter em sincronia com CUSTOMER_PERMISSIONS em routes/adminCustomers.js no backend.
export const CUSTOMER_FEATURES: { key: CustomerPermission; label: string; hint: string }[] = [
  {
    key: "confirmar_entrega",
    label: "Confirmar entrega dos próprios pedidos",
    hint: "O cliente marca em \"Meus Pedidos\" o que recebeu, com o mesmo formulário de entrega parcial e perdas do admin.",
  },
];
