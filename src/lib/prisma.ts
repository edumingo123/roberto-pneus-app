import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Ensures every query is scoped to the current tenant.
 * Use this helper in server actions and API routes.
 */
export function tenantWhere(tenantId: string) {
  return { tenantId } as const;
}

export function assertTenantAccess(
  resourceTenantId: string,
  sessionTenantId: string
): void {
  if (resourceTenantId !== sessionTenantId) {
    throw new Error("Acesso negado: recurso de outro tenant.");
  }
}
