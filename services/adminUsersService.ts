// Serviço de API para administradores cadastrados (login por CPF, acesso por aba)
import { authenticatedFetch, getToken } from "./apiService";
import type { AdminPermission, AdminUser } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/api`;

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

// Grava o token no mesmo local que authenticatedFetch já lê
export async function adminUserLogin(cpf: string, password: string): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/admin-users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cpf, password }),
  });
  const data = await handle<{ success: boolean; token: string; admin: AdminUser }>(response);
  localStorage.setItem("jwt_token", data.token);
  return data.admin;
}

// Permissões atuais de quem está logado. Usa fetch direto (e não authenticatedFetch)
// para quem chama decidir o que fazer com um 401 (acesso revogado).
export async function getMyAdminAccess(): Promise<
  { master: true; permissions: AdminPermission[] } | ({ master: false } & AdminUser)
> {
  const response = await fetch(`${API_URL}/admin-users/me`, {
    headers: { Authorization: `Bearer ${getToken() || ""}` },
  });
  return handle(response);
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await authenticatedFetch(`${API_URL}/admin-users`);
  return handle<AdminUser[]>(response);
}

export async function createAdminUser(data: {
  name: string;
  cpf: string;
  email: string;
  phone?: string;
  password: string;
  permissions: AdminPermission[];
}): Promise<AdminUser> {
  const response = await authenticatedFetch(`${API_URL}/admin-users`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handle<AdminUser>(response);
}

export async function updateAdminUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    password: string;
    active: boolean;
    permissions: AdminPermission[];
  }>,
): Promise<AdminUser> {
  const response = await authenticatedFetch(`${API_URL}/admin-users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handle<AdminUser>(response);
}

export async function deleteAdminUser(id: string): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/admin-users/${id}`, {
    method: "DELETE",
  });
  await handle<{ ok: boolean }>(response);
}
