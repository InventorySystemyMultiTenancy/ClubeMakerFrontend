import type { MaintenanceLevel, PrinterStatus } from "../../../types";

export const STATUS_LABEL: Record<PrinterStatus, string> = {
  idle: "Ociosa",
  running: "Imprimindo",
  overdue: "Atrasada",
  maintenance: "Manutenção",
  offline: "Offline",
};

export const STATUS_DOT_CLASSES: Record<PrinterStatus, string> = {
  idle: "bg-stone-400",
  running: "bg-blue-500",
  overdue: "bg-red-500",
  maintenance: "bg-amber-500",
  offline: "bg-stone-300",
};

export const STATUS_PILL_CLASSES: Record<PrinterStatus, string> = {
  idle: "bg-stone-100 text-stone-600",
  running: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  maintenance: "bg-amber-100 text-amber-700",
  offline: "bg-stone-200 text-stone-500",
};

export const LEVEL_LABEL: Record<MaintenanceLevel, string> = {
  ok: "Em dia",
  warning: "Trocar em breve",
  critical: "Vencida",
};

export const LEVEL_PILL_CLASSES: Record<MaintenanceLevel, string> = {
  ok: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export function formatMinutes(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(totalMinutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h > 0) return `${sign}${h}h ${m}min`;
  return `${sign}${m} min`;
}

export function formatBRL(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatGrams(value: number | null | undefined): string {
  return `${(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} g`;
}
