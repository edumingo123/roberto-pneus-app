import type { ServiceOrderStatus } from "@/lib/data/types";
import { SERVICE_ORDER_STATUS_LABELS } from "@/types";

export const OS_STATUS_ORDER: ServiceOrderStatus[] = [
  "ORCAMENTO",
  "APROVADO",
  "EM_EXECUCAO",
  "QUALITY_CHECK",
  "PRONTO_RETIRADA",
  "ENTREGUE",
];

export const OS_STATUS_COLORS: Record<ServiceOrderStatus, string> = {
  ORCAMENTO: "#F59E0B",
  APROVADO: "#3B82F6",
  EM_EXECUCAO: "#F97316",
  QUALITY_CHECK: "#8B5CF6",
  PRONTO_RETIRADA: "#10B981",
  ENTREGUE: "#0A2540",
  CANCELADO: "#94A3B8",
};

/** Allowed forward transitions (+ cancel from non-terminal) */
export const OS_TRANSITIONS: Record<
  ServiceOrderStatus,
  ServiceOrderStatus[]
> = {
  ORCAMENTO: ["APROVADO", "CANCELADO"],
  APROVADO: ["EM_EXECUCAO", "CANCELADO"],
  EM_EXECUCAO: ["QUALITY_CHECK", "CANCELADO"],
  QUALITY_CHECK: ["PRONTO_RETIRADA", "EM_EXECUCAO", "CANCELADO"],
  PRONTO_RETIRADA: ["ENTREGUE", "CANCELADO"],
  ENTREGUE: [],
  CANCELADO: [],
};

export function canTransition(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus
): boolean {
  return OS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function osStatusLabel(status: ServiceOrderStatus): string {
  return SERVICE_ORDER_STATUS_LABELS[status] ?? status;
}

/** Statuses that require kmAtExit when transitioning TO them */
export function requiresExitKm(to: ServiceOrderStatus): boolean {
  return to === "ENTREGUE";
}

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  AGUARDANDO_APROVACAO: "#F59E0B",
  CONFIRMADO: "#3B82F6",
  EM_ANDAMENTO: "#F97316",
  CONCLUIDO: "#10B981",
  CANCELADO: "#94A3B8",
  NAO_COMPARECEU: "#EF4444",
};
