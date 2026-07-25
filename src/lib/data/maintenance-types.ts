import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/auth/session";
import { paginate, parsePage } from "@/lib/utils/pagination";
import { getDemoStore, newId } from "./demo-store";
import type { MaintenanceTypeRecord, PaginatedResult } from "./types";

export interface MaintenanceTypeFormInput {
  name: string;
  description?: string | null;
  defaultKm?: number | null;
  defaultDays?: number | null;
  isActive: boolean;
}

export interface ListMaintenanceTypesParams {
  tenantId: string;
  q?: string;
  activeOnly?: boolean;
  page?: number | string;
}

function resolveIntervalType(
  km: number | null | undefined,
  days: number | null | undefined
): "KM" | "DIAS" | "AMBOS" {
  if (km && days) return "AMBOS";
  if (km) return "KM";
  return "DIAS";
}

export async function listMaintenanceTypes(
  params: ListMaintenanceTypesParams
): Promise<PaginatedResult<MaintenanceTypeRecord>> {
  const page = parsePage(params.page);
  const q = params.q?.trim().toLowerCase() ?? "";

  if (isDemoMode()) {
    const store = getDemoStore();
    let items = store.maintenanceTypes.filter(
      (t) => t.tenantId === params.tenantId
    );
    if (params.activeOnly) items = items.filter((t) => t.isActive);
    if (q) {
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false)
      );
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return paginate(items, page);
  }

  const where = {
    tenantId: params.tenantId,
    ...(params.activeOnly ? { isActive: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.maintenanceType.count({ where }),
    prisma.maintenanceType.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * 10,
      take: 10,
    }),
  ]);

  return {
    items: rows.map(mapType),
    total,
    page,
    pageSize: 10,
    totalPages: Math.max(1, Math.ceil(total / 10)),
  };
}

export async function getMaintenanceTypeById(
  tenantId: string,
  id: string
): Promise<MaintenanceTypeRecord | null> {
  if (isDemoMode()) {
    return (
      getDemoStore().maintenanceTypes.find(
        (t) => t.id === id && t.tenantId === tenantId
      ) ?? null
    );
  }
  const r = await prisma.maintenanceType.findFirst({
    where: { id, tenantId },
  });
  return r ? mapType(r) : null;
}

export async function createMaintenanceType(
  tenantId: string,
  input: MaintenanceTypeFormInput
): Promise<MaintenanceTypeRecord> {
  const name = input.name.trim();
  const defaultKm = input.defaultKm ?? null;
  const defaultDays = input.defaultDays ?? null;
  const ts = new Date().toISOString();

  if (isDemoMode()) {
    const store = getDemoStore();
    if (
      store.maintenanceTypes.some(
        (t) =>
          t.tenantId === tenantId &&
          t.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      throw new Error("Já existe um tipo com este nome");
    }
    const record: MaintenanceTypeRecord = {
      id: newId(),
      tenantId,
      name,
      description: input.description?.trim() || null,
      defaultKm,
      defaultDays,
      intervalType: resolveIntervalType(defaultKm, defaultDays),
      isSystem: false,
      isActive: input.isActive,
      createdAt: ts,
      updatedAt: ts,
    };
    store.maintenanceTypes.push(record);
    return record;
  }

  const r = await prisma.maintenanceType.create({
    data: {
      tenantId,
      name,
      description: input.description?.trim() || null,
      defaultKm,
      defaultDays,
      intervalType: resolveIntervalType(defaultKm, defaultDays),
      isSystem: false,
      isActive: input.isActive,
    },
  });
  return mapType(r);
}

export async function updateMaintenanceType(
  tenantId: string,
  id: string,
  input: MaintenanceTypeFormInput
): Promise<MaintenanceTypeRecord | null> {
  const name = input.name.trim();
  const defaultKm = input.defaultKm ?? null;
  const defaultDays = input.defaultDays ?? null;

  if (isDemoMode()) {
    const store = getDemoStore();
    const idx = store.maintenanceTypes.findIndex(
      (t) => t.id === id && t.tenantId === tenantId
    );
    if (idx < 0) return null;
    if (
      store.maintenanceTypes.some(
        (t) =>
          t.tenantId === tenantId &&
          t.id !== id &&
          t.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      throw new Error("Já existe um tipo com este nome");
    }
    const updated: MaintenanceTypeRecord = {
      ...store.maintenanceTypes[idx],
      name,
      description: input.description?.trim() || null,
      defaultKm,
      defaultDays,
      intervalType: resolveIntervalType(defaultKm, defaultDays),
      isActive: input.isActive,
      updatedAt: new Date().toISOString(),
    };
    store.maintenanceTypes[idx] = updated;
    return updated;
  }

  const existing = await prisma.maintenanceType.findFirst({
    where: { id, tenantId },
  });
  if (!existing) return null;

  const r = await prisma.maintenanceType.update({
    where: { id },
    data: {
      name,
      description: input.description?.trim() || null,
      defaultKm,
      defaultDays,
      intervalType: resolveIntervalType(defaultKm, defaultDays),
      isActive: input.isActive,
    },
  });
  return mapType(r);
}

export async function deleteMaintenanceType(
  tenantId: string,
  id: string
): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore();
    const item = store.maintenanceTypes.find(
      (t) => t.id === id && t.tenantId === tenantId
    );
    if (!item) return false;
    if (item.isSystem) {
      // soft-disable system types
      item.isActive = false;
      item.updatedAt = new Date().toISOString();
      return true;
    }
    const used = store.maintenancePlans.some((p) => p.maintenanceTypeId === id);
    if (used) {
      item.isActive = false;
      item.updatedAt = new Date().toISOString();
      return true;
    }
    store.maintenanceTypes = store.maintenanceTypes.filter((t) => t.id !== id);
    return true;
  }

  const existing = await prisma.maintenanceType.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { plans: true } } },
  });
  if (!existing) return false;

  if (existing.isSystem || existing._count.plans > 0) {
    await prisma.maintenanceType.update({
      where: { id },
      data: { isActive: false },
    });
    return true;
  }

  await prisma.maintenanceType.delete({ where: { id } });
  return true;
}

function mapType(r: {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  defaultKm: number | null;
  defaultDays: number | null;
  intervalType: "KM" | "DIAS" | "AMBOS";
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MaintenanceTypeRecord {
  return {
    id: r.id,
    tenantId: r.tenantId,
    name: r.name,
    description: r.description,
    defaultKm: r.defaultKm,
    defaultDays: r.defaultDays,
    intervalType: r.intervalType,
    isSystem: r.isSystem,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
