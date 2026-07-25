import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser, TenantInfo, UserRole } from "@/types";

export interface AppSession {
  user: SessionUser;
  tenant: TenantInfo;
}

/**
 * Loads the authenticated staff user + tenant from Supabase Auth + Prisma.
 * Returns null when unauthenticated or profile not found.
 */
export async function getSession(): Promise<AppSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const dbUser = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isActive: true,
          },
        },
      },
    });

    if (!dbUser || !dbUser.isActive || !dbUser.tenant.isActive) {
      return null;
    }

    const sessionUser: SessionUser = {
      id: dbUser.id,
      authUserId: dbUser.authUserId,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserRole,
      tenantId: dbUser.tenantId,
      avatarUrl: dbUser.avatarUrl,
      phone: dbUser.phone,
    };

    const tenant: TenantInfo = {
      id: dbUser.tenant.id,
      name: dbUser.tenant.name,
      slug: dbUser.tenant.slug,
      logoUrl: dbUser.tenant.logoUrl,
    };

    return { user: sessionUser, tenant };
  } catch {
    return null;
  }
}

/**
 * Demo session for local development without Supabase configured.
 * Enabled only when DEMO_MODE=true.
 */
export function getDemoSession(): AppSession {
  return {
    user: {
      id: "demo-user-admin",
      authUserId: "demo-auth",
      email: "admin@robertopneus.demo",
      name: "Admin Demo",
      role: "ADMIN",
      tenantId: "demo-tenant",
      avatarUrl: null,
      phone: null,
    },
    tenant: {
      id: "demo-tenant",
      name: "Roberto Pneus",
      slug: "roberto-pneus",
      logoUrl: null,
    },
  };
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export async function requireSession(): Promise<AppSession> {
  if (isDemoMode()) {
    return getDemoSession();
  }

  const session = await getSession();
  if (!session) {
    throw new Error("Não autenticado");
  }
  return session;
}

export async function requireRole(
  allowed: UserRole | UserRole[]
): Promise<AppSession> {
  const session = await requireSession();
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!list.includes(session.user.role)) {
    throw new Error("Permissão insuficiente");
  }
  return session;
}
