// Serviço de API para o módulo de gestão da frota de impressoras 3D (admin)
import { authenticatedFetch } from "./apiService";
import type {
  Filament,
  MaintenanceLevel,
  Printer,
  PrinterPart,
  PrintFarmSummary,
  PrintJob,
  PrintOperator,
  PrintProduct,
} from "../types";

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
    throw new Error(message);
  }
  return response.json();
}

// ===== Impressoras =====

export async function getPrinters(): Promise<Printer[]> {
  const response = await authenticatedFetch(`${API_URL}/printers`);
  return handle<Printer[]>(response);
}

export async function createPrinter(data: {
  number: number;
  nickname?: string;
  brand?: string;
  model?: string;
  purchase_date?: string;
  notes?: string;
}): Promise<Printer> {
  const response = await authenticatedFetch(`${API_URL}/printers`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handle<Printer>(response);
}

export async function updatePrinter(
  id: number,
  data: Partial<Pick<Printer, "nickname" | "brand" | "model" | "purchase_date" | "notes" | "status">>,
): Promise<Printer> {
  const response = await authenticatedFetch(`${API_URL}/printers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handle<Printer>(response);
}

export async function deletePrinter(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/printers/${id}`, {
    method: "DELETE",
  });
  await handle<{ ok: boolean }>(response);
}

// ===== Peças / manutenção preventiva =====

export async function getPrinterParts(printerId: number): Promise<PrinterPart[]> {
  const response = await authenticatedFetch(`${API_URL}/printers/${printerId}/parts`);
  return handle<PrinterPart[]>(response);
}

export async function createPrinterPart(
  printerId: number,
  data: { part_type: string; lifespan_prints: number; replacement_cost?: number },
): Promise<PrinterPart> {
  const response = await authenticatedFetch(`${API_URL}/printers/${printerId}/parts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handle<PrinterPart>(response);
}

export async function updatePrinterPart(
  id: number,
  data: Partial<{ part_type: string; lifespan_prints: number; replacement_cost: number }>,
): Promise<PrinterPart> {
  const response = await authenticatedFetch(`${API_URL}/printer-parts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handle<PrinterPart>(response);
}

export async function replacePrinterPart(id: number): Promise<PrinterPart> {
  const response = await authenticatedFetch(`${API_URL}/printer-parts/${id}/replace`, {
    method: "POST",
  });
  return handle<PrinterPart>(response);
}

export async function deletePrinterPart(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/printer-parts/${id}`, {
    method: "DELETE",
  });
  await handle<{ ok: boolean }>(response);
}

export async function getMaintenanceAlerts(): Promise<PrinterPart[]> {
  const response = await authenticatedFetch(`${API_URL}/print-farm/maintenance-alerts`);
  return handle<PrinterPart[]>(response);
}

export const MAINTENANCE_LEVEL_LABEL: Record<MaintenanceLevel, string> = {
  ok: "Em dia",
  warning: "Trocar em breve",
  critical: "Vencida",
};

// ===== Filamentos =====

export async function getFilaments(): Promise<Filament[]> {
  const response = await authenticatedFetch(`${API_URL}/filaments`);
  return handle<Filament[]>(response);
}

export async function createFilament(data: {
  material: string;
  color?: string;
  brand?: string;
  cost_per_kg: number;
  stock_grams?: number;
}): Promise<Filament> {
  const response = await authenticatedFetch(`${API_URL}/filaments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handle<Filament>(response);
}

export async function updateFilament(
  id: number,
  data: Partial<{ material: string; color: string; brand: string; cost_per_kg: number; stock_grams: number }>,
): Promise<Filament> {
  const response = await authenticatedFetch(`${API_URL}/filaments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handle<Filament>(response);
}

export async function deleteFilament(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/filaments/${id}`, {
    method: "DELETE",
  });
  await handle<{ ok: boolean }>(response);
}

// ===== Perfis de produto de impressão =====

export async function getPrintProducts(): Promise<PrintProduct[]> {
  const response = await authenticatedFetch(`${API_URL}/print-products`);
  return handle<PrintProduct[]>(response);
}

export async function createPrintProduct(data: {
  name: string;
  product_id?: string | null;
  size_variant?: string;
  units_per_plate: number;
  estimated_time_minutes: number;
  filament_id?: number | null;
  filament_grams_per_plate?: number;
  manual_unit_price?: number | null;
}): Promise<PrintProduct> {
  const response = await authenticatedFetch(`${API_URL}/print-products`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handle<PrintProduct>(response);
}

export async function updatePrintProduct(
  id: number,
  data: Partial<{
    name: string;
    product_id: string | null;
    size_variant: string;
    units_per_plate: number;
    estimated_time_minutes: number;
    filament_id: number | null;
    filament_grams_per_plate: number;
    manual_unit_price: number | null;
  }>,
): Promise<PrintProduct> {
  const response = await authenticatedFetch(`${API_URL}/print-products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handle<PrintProduct>(response);
}

export async function deletePrintProduct(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/print-products/${id}`, {
    method: "DELETE",
  });
  await handle<{ ok: boolean }>(response);
}

// ===== Ciclo de produção (jobs) =====

export async function getPrintJobs(params?: {
  status?: string;
  printer_id?: number;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<PrintJob[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.printer_id) query.set("printer_id", String(params.printer_id));
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const response = await authenticatedFetch(`${API_URL}/print-jobs${qs ? `?${qs}` : ""}`);
  return handle<PrintJob[]>(response);
}

export async function startPrintJob(data: {
  printer_id: number;
  print_product_id: number;
}): Promise<PrintJob> {
  const response = await authenticatedFetch(`${API_URL}/print-jobs/start`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handle<PrintJob>(response);
}

export async function finishPrintJob(
  id: number,
  data: { success_count: number; fail_count: number },
): Promise<PrintJob> {
  const response = await authenticatedFetch(`${API_URL}/print-jobs/${id}/finish`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handle<PrintJob>(response);
}

// Jobs em andamento/atrasados com os dados mínimos para operar a frota
// (usado tanto pelo painel do admin quanto pela tela do operador).
export async function getActivePrintJobs(): Promise<PrintJob[]> {
  const response = await authenticatedFetch(`${API_URL}/print-farm/active-jobs`);
  return handle<PrintJob[]>(response);
}

// ===== Relatórios (perda, custo, lucro) =====

export async function getPrintFarmSummary(params?: {
  from?: string;
  to?: string;
  printer_id?: number;
}): Promise<PrintFarmSummary> {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.printer_id) query.set("printer_id", String(params.printer_id));
  const qs = query.toString();
  const response = await authenticatedFetch(`${API_URL}/print-farm/summary${qs ? `?${qs}` : ""}`);
  return handle<PrintFarmSummary>(response);
}

// ===== Operadores (funcionários que ligam/desligam impressoras) =====

export async function getPrintOperators(): Promise<PrintOperator[]> {
  const response = await authenticatedFetch(`${API_URL}/print-farm/operators`);
  return handle<PrintOperator[]>(response);
}

export async function createPrintOperator(data: {
  name: string;
  username: string;
  password: string;
}): Promise<PrintOperator> {
  const response = await authenticatedFetch(`${API_URL}/print-farm/operators`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handle<PrintOperator>(response);
}

export async function updatePrintOperator(
  id: number,
  data: Partial<{ name: string; active: boolean; password: string }>,
): Promise<PrintOperator> {
  const response = await authenticatedFetch(`${API_URL}/print-farm/operators/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handle<PrintOperator>(response);
}

export async function deletePrintOperator(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/print-farm/operators/${id}`, {
    method: "DELETE",
  });
  await handle<{ ok: boolean }>(response);
}

// Login do operador é um fluxo próprio (não usa a senha compartilhada de admin/cozinha):
// grava o token no mesmo local que authenticatedFetch já lê, então os demais endpoints
// funcionam sem nenhuma mudança.
export async function operatorLogin(
  username: string,
  password: string,
): Promise<{ id: number; name: string }> {
  const response = await fetch(`${API_URL}/print-farm/operators/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await handle<{ success: boolean; token: string; operator: { id: number; name: string } }>(
    response,
  );
  localStorage.setItem("jwt_token", data.token);
  return data.operator;
}
