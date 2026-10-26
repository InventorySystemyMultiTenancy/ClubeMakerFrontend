// Serviço de API para clientes: cadastro pelo admin (aba "Clientes") e ações do
// próprio cliente que exigem identidade confirmada (ex.: registrar a entrega).
import { authenticatedFetch } from "./apiService";
import type { Customer, CustomerPermission } from "../types";
import type { RegisterOrderDeliveryPayload } from "./apiService";
import { notifySessionExpired } from "../utils/session";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/api`;

// Token do cliente fica separado do jwt_token de admin/cozinha/operador: o login do
// admin trata a presença de jwt_token como "já logado" e redirecionaria o cliente.
const CUSTOMER_TOKEN_KEY = "customer_token";

export function saveCustomerToken(token: string | null | undefined): void {
  try {
    if (token) localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    else localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getCustomerToken(): string | null {
  try {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const error = await response.json();
      message = error.error || message;
    } catch {
      // resposta sem corpo JSON
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }
  return response.json();
}

const customerFetch = async (url: string, options: RequestInit = {}) => {
  const token = getCustomerToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || ""}`,
    },
  });
  // Token do cliente vencido: o AuthContext desloga e pede login de novo
  if (response.status === 401 && token) notifySessionExpired();
  return response;
};

// ========== Cliente logado ==========
export async function getMyCustomerAccess(): Promise<Customer> {
  return handle<Customer>(await customerFetch(`${API_URL}/customer/me`));
}

export async function registerCustomerDelivery(
  orderId: string,
  payload: RegisterOrderDeliveryPayload,
): Promise<{ deliveryStatus: "partial" | "delivered" }> {
  const response = await customerFetch(`${API_URL}/customer/orders/${orderId}/deliveries`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handle(response);
}

// ========== Admin ==========
export interface CustomerFormPayload {
  name: string;
  cpf: string;
  email: string;
  phone?: string;
  cep?: string;
  address?: string;
  password?: string;
  permissions: CustomerPermission[];
}

export async function getCustomers(): Promise<Customer[]> {
  return handle<Customer[]>(await authenticatedFetch(`${API_URL}/admin-customers`));
}

export async function createCustomer(data: CustomerFormPayload): Promise<Customer> {
  const response = await authenticatedFetch(`${API_URL}/admin-customers`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handle<Customer>(response);
}

export async function updateCustomer(
  id: string,
  data: Partial<CustomerFormPayload>,
): Promise<Customer> {
  const response = await authenticatedFetch(`${API_URL}/admin-customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handle<Customer>(response);
}
