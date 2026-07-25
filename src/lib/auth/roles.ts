import type { UserRole } from "@/types";

export const ALL_ROLES: UserRole[] = ["ADMIN", "MECANICO", "RECEPCIONISTA"];

export function hasRole(
  userRole: UserRole,
  allowed: UserRole | UserRole[]
): boolean {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.includes(userRole);
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageSettings(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canCreateServiceOrder(role: UserRole): boolean {
  return role === "ADMIN" || role === "RECEPCIONISTA" || role === "MECANICO";
}

export function canApproveBudget(role: UserRole): boolean {
  return role === "ADMIN" || role === "RECEPCIONISTA";
}

export function canExecuteServiceOrder(role: UserRole): boolean {
  return role === "ADMIN" || role === "MECANICO";
}
