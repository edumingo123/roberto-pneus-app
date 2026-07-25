/**
 * Valida placa brasileira (Mercosul e padrão antigo).
 * Antigo: ABC1234
 * Mercosul: ABC1D23
 */
export const PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;

export function normalizePlate(plate: string): string {
  return plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function isValidPlate(plate: string): boolean {
  return PLATE_REGEX.test(normalizePlate(plate));
}

export function formatPlate(plate: string): string {
  const p = normalizePlate(plate);
  if (p.length !== 7) return p;
  return `${p.slice(0, 3)}-${p.slice(3)}`;
}
