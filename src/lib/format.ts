import {
  formatCep,
  formatCpfCnpj,
  formatWhatsApp,
} from "@/lib/validations/document";
import { formatPlate } from "@/lib/validations/plate";

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formatKm(km: number): string {
  return `${km.toLocaleString("pt-BR")} km`;
}

export { formatCep, formatCpfCnpj, formatWhatsApp, formatPlate };
