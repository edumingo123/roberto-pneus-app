import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser, TenantInfo, UserRole } from "@/types";

export interface AppSession {
  user: SessionUser;
  tenant: TenantInfo;
}

function mapSession(
  dbUser: {
    id: string;
    authUserId: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    avatarUrl: string | null;
    phone: string | null;
    tenant: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
    };
  }
): AppSession {
  return {
    user: {
      id: dbUser.id,
      authUserId: dbUser.authUserId,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserRole,
      tenantId: dbUser.tenantId,
      avatarUrl: dbUser.avatarUrl,
      phone: dbUser.phone,
    },
    tenant: {
      id: dbUser.tenant.id,
      name: dbUser.tenant.name,
      slug: dbUser.tenant.slug,
      logoUrl: dbUser.tenant.logoUrl,
    },
  };
}

/**
 * Loads the authenticated staff user + tenant from Supabase Auth + Prisma.
 * Returns null when unauthenticated or profile not found.
 *
 * Auto-link: if Auth user exists but authUserId is not linked yet, try match by email
 * (common after seed with pending authUserId).
 */
export async function getSession(): Promise<AppSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    let dbUser = await prisma.user.findUnique({
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

    // Link existing staff row by email (seed / first login)
    if (!dbUser && authUser.email) {
      const byEmail = await prisma.user.findFirst({
        where: {
          email: { equals: authUser.email, mode: "insensitive" },
          isActive: true,
          tenant: { isActive: true },
        },
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

      if (byEmail) {
        dbUser = await prisma.user.update({
          where: { id: byEmail.id },
          data: { authUserId: authUser.id, lastLoginAt: new Date() },
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
      }
    }

    if (!dbUser || !dbUser.isActive || !dbUser.tenant.isActive) {
      return null;
    }

    // Touch last login (best-effort)
    void prisma.user
      .update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() },
      })
      .catch(() => undefined);

    return mapSession(dbUser);
  } catch {
    return null;
  }
}

/**
 * Demo session for local development without Supabase configured.
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
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
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
