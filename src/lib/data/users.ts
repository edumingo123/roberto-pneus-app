import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/auth/session";
import { onlyDigits } from "@/lib/validations/document";
import { generateTempPassword } from "@/lib/validations/user";
import { paginate, parsePage } from "@/lib/utils/pagination";
import { getDemoStore, newId } from "./demo-store";
import type { PaginatedResult, UserRecord, UserRole } from "./types";

export interface UserFormInput {
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  specialty?: string | null;
  isActive: boolean;
  password?: string | null;
  generatePassword?: boolean;
  avatarUrl?: string | null;
}

export interface ListUsersParams {
  tenantId: string;
  q?: string;
  role?: UserRole | "TODOS";
  page?: number | string;
}

export interface CreateUserResult {
  user: UserRecord;
  temporaryPassword: string | null;
}

export async function listUsers(
  params: ListUsersParams
): Promise<PaginatedResult<UserRecord>> {
  const page = parsePage(params.page);
  const q = params.q?.trim().toLowerCase() ?? "";
  const role = params.role ?? "TODOS";

  if (isDemoMode()) {
    let items = getDemoStore().users.filter(
      (u) => u.tenantId === params.tenantId
    );
    if (role !== "TODOS") items = items.filter((u) => u.role === role);
    if (q) {
      items = items.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone?.includes(q) ?? false) ||
          (u.specialty?.toLowerCase().includes(q) ?? false)
      );
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return paginate(items, page);
  }

  const where = {
    tenantId: params.tenantId,
    ...(role !== "TODOS" ? { role } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { specialty: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * 10,
      take: 10,
    }),
  ]);

  return {
    items: rows.map(mapUser),
    total,
    page,
    pageSize: 10,
    totalPages: Math.max(1, Math.ceil(total / 10)),
  };
}

export async function getUserById(
  tenantId: string,
  id: string
): Promise<UserRecord | null> {
  if (isDemoMode()) {
    return (
      getDemoStore().users.find(
        (u) => u.id === id && u.tenantId === tenantId
      ) ?? null
    );
  }
  const r = await prisma.user.findFirst({ where: { id, tenantId } });
  return r ? mapUser(r) : null;
}

export async function createUser(
  tenantId: string,
  input: UserFormInput
): Promise<CreateUserResult> {
  const email = input.email.trim().toLowerCase();
  const tempPassword =
    input.generatePassword || !input.password
      ? generateTempPassword()
      : input.password;

  if (isDemoMode()) {
    const store = getDemoStore();
    if (
      store.users.some(
        (u) => u.tenantId === tenantId && u.email.toLowerCase() === email
      )
    ) {
      throw new Error("Já existe usuário com este e-mail");
    }
    const ts = new Date().toISOString();
    const user: UserRecord = {
      id: newId(),
      tenantId,
      authUserId: `pending-${newId()}`,
      email,
      name: input.name.trim(),
      phone: input.phone ? onlyDigits(input.phone) : null,
      role: input.role,
      specialty:
        input.role === "MECANICO"
          ? input.specialty?.trim() || null
          : null,
      avatarUrl: input.avatarUrl?.trim() || null,
      isActive: input.isActive,
      tempPassword,
      lastLoginAt: null,
      createdAt: ts,
      updatedAt: ts,
    };
    store.users.push(user);
    return { user, temporaryPassword: tempPassword };
  }

  // Production: create Supabase auth user when service role is available
  let authUserId = `pending-${newId()}`;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceKey && url && !url.includes("your-project")) {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: input.name.trim(), tenantId },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Falha ao criar usuário no Auth");
    authUserId = data.user.id;
  }

  const r = await prisma.user.create({
    data: {
      tenantId,
      authUserId,
      email,
      name: input.name.trim(),
      phone: input.phone ? onlyDigits(input.phone) : null,
      role: input.role,
      specialty:
        input.role === "MECANICO" ? input.specialty?.trim() || null : null,
      avatarUrl: input.avatarUrl?.trim() || null,
      isActive: input.isActive,
    },
  });

  return { user: mapUser(r), temporaryPassword: tempPassword };
}

export async function updateUser(
  tenantId: string,
  id: string,
  input: UserFormInput
): Promise<UserRecord | null> {
  const email = input.email.trim().toLowerCase();

  if (isDemoMode()) {
    const store = getDemoStore();
    const idx = store.users.findIndex(
      (u) => u.id === id && u.tenantId === tenantId
    );
    if (idx < 0) return null;
    if (
      store.users.some(
        (u) =>
          u.tenantId === tenantId &&
          u.id !== id &&
          u.email.toLowerCase() === email
      )
    ) {
      throw new Error("Já existe usuário com este e-mail");
    }
    const updated: UserRecord = {
      ...store.users[idx],
      email,
      name: input.name.trim(),
      phone: input.phone ? onlyDigits(input.phone) : null,
      role: input.role,
      specialty:
        input.role === "MECANICO" ? input.specialty?.trim() || null : null,
      avatarUrl: input.avatarUrl?.trim() || null,
      isActive: input.isActive,
      updatedAt: new Date().toISOString(),
    };
    store.users[idx] = updated;
    return updated;
  }

  const existing = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!existing) return null;

  const r = await prisma.user.update({
    where: { id },
    data: {
      email,
      name: input.name.trim(),
      phone: input.phone ? onlyDigits(input.phone) : null,
      role: input.role,
      specialty:
        input.role === "MECANICO" ? input.specialty?.trim() || null : null,
      avatarUrl: input.avatarUrl?.trim() || null,
      isActive: input.isActive,
    },
  });
  return mapUser(r);
}

export async function deleteUser(
  tenantId: string,
  id: string,
  currentUserId: string
): Promise<boolean> {
  if (id === currentUserId) {
    throw new Error("Você não pode desativar a si mesmo");
  }

  if (isDemoMode()) {
    const store = getDemoStore();
    const idx = store.users.findIndex(
      (u) => u.id === id && u.tenantId === tenantId
    );
    if (idx < 0) return false;
    store.users[idx] = {
      ...store.users[idx],
      isActive: false,
      updatedAt: new Date().toISOString(),
    };
    return true;
  }

  const existing = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!existing) return false;
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
  return true;
}

function mapUser(r: {
  id: string;
  tenantId: string;
  authUserId: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  specialty?: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): UserRecord {
  return {
    id: r.id,
    tenantId: r.tenantId,
    authUserId: r.authUserId,
    email: r.email,
    name: r.name,
    phone: r.phone,
    role: r.role,
    specialty: r.specialty ?? null,
    avatarUrl: r.avatarUrl,
    isActive: r.isActive,
    lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
