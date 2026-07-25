import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/auth/session";
import { onlyDigits } from "@/lib/validations/document";
import { paginate, parsePage } from "@/lib/utils/pagination";
import { DEMO_TENANT_ID, getDemoStore, newId } from "./demo-store";
import type {
  ClientDetail,
  ClientFormInput,
  ClientRecord,
  ClientWithVehicles,
  PaginatedResult,
} from "./clients-types";

export type { ClientFormInput, ClientDetail, ClientWithVehicles } from "./clients-types";

export interface ListClientsParams {
  tenantId: string;
  q?: string;
  status?: "ATIVO" | "INATIVO" | "TODOS";
  page?: number | string;
}

function matchesSearch(c: ClientRecord, q: string): boolean {
  const needle = q.toLowerCase().trim();
  if (!needle) return true;
  const digits = onlyDigits(needle);
  return (
    c.name.toLowerCase().includes(needle) ||
    (c.email?.toLowerCase().includes(needle) ?? false) ||
    c.whatsapp.includes(digits || needle) ||
    onlyDigits(c.document).includes(digits || needle) ||
    c.document.includes(needle)
  );
}

export async function listClients(
  params: ListClientsParams
): Promise<PaginatedResult<ClientWithVehicles>> {
  const page = parsePage(params.page);
  const status = params.status ?? "TODOS";
  const q = params.q?.trim() ?? "";

  if (isDemoMode()) {
    const store = getDemoStore();
    let items = store.clients.filter((c) => c.tenantId === params.tenantId);
    if (status !== "TODOS") items = items.filter((c) => c.status === status);
    if (q) items = items.filter((c) => matchesSearch(c, q));
    items = items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const withVehicles: ClientWithVehicles[] = items.map((c) => {
      const vehicles = store.vehicles.filter(
        (v) => v.clientId === c.id && v.tenantId === params.tenantId
      );
      return { ...c, vehicles, _count: { vehicles: vehicles.length } };
    });

    return paginate(withVehicles, page);
  }

  const where = {
    tenantId: params.tenantId,
    ...(status !== "TODOS" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { whatsapp: { contains: onlyDigits(q) || q } },
            { document: { contains: onlyDigits(q) || q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      include: {
        vehicles: {
          where: { isActive: true },
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
            currentKm: true,
            yearModel: true,
            color: true,
            tenantId: true,
            clientId: true,
            yearManufacture: true,
            chassis: true,
            fuel: true,
            transmission: true,
            engine: true,
            power: true,
            engineCode: true,
            notes: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { vehicles: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * 10,
      take: 10,
    }),
  ]);

  const items: ClientWithVehicles[] = rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    name: r.name,
    document: r.document ?? "",
    whatsapp: r.whatsapp ?? "",
    email: r.email,
    birthDate: r.birthDate?.toISOString().slice(0, 10) ?? null,
    gender: r.gender,
    addressStreet: r.addressStreet ?? "",
    addressNumber: r.addressNumber ?? "",
    addressComplement: r.addressComplement,
    addressDistrict: r.addressDistrict ?? "",
    addressCity: r.addressCity ?? "",
    addressState: r.addressState ?? "",
    addressZip: r.addressZip ?? "",
    notes: r.notes,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    vehicles: r.vehicles.map((v) => ({
      ...v,
      fuel: v.fuel,
      transmission: v.transmission,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
    _count: r._count,
  }));

  return {
    items,
    total,
    page,
    pageSize: 10,
    totalPages: Math.max(1, Math.ceil(total / 10)),
  };
}

export async function getClientById(
  tenantId: string,
  id: string
): Promise<ClientDetail | null> {
  if (isDemoMode()) {
    const store = getDemoStore();
    const client = store.clients.find(
      (c) => c.id === id && c.tenantId === tenantId
    );
    if (!client) return null;

    const vehicles = store.vehicles
      .filter((v) => v.clientId === id && v.tenantId === tenantId)
      .map((v) => {
        const documents = store.vehicleDocuments.filter(
          (d) => d.vehicleId === v.id
        );
        const maintenancePlans = store.maintenancePlans
          .filter((p) => p.vehicleId === v.id && p.isActive)
          .map((p) => {
            const type = store.maintenanceTypes.find(
              (t) => t.id === p.maintenanceTypeId
            );
            return {
              ...p,
              maintenanceType: {
                id: type?.id ?? p.maintenanceTypeId,
                name: type?.name ?? "Tipo",
              },
            };
          });
        return { ...v, documents, maintenancePlans };
      });

    return { ...client, vehicles };
  }

  const r = await prisma.client.findFirst({
    where: { id, tenantId },
    include: {
      vehicles: {
        include: {
          documents: true,
          maintenancePlans: {
            where: { isActive: true },
            include: {
              maintenanceType: { select: { id: true, name: true } },
            },
            orderBy: { nextDueAt: "asc" },
          },
        },
      },
    },
  });

  if (!r) return null;

  return {
    id: r.id,
    tenantId: r.tenantId,
    name: r.name,
    document: r.document ?? "",
    whatsapp: r.whatsapp ?? "",
    email: r.email,
    birthDate: r.birthDate?.toISOString().slice(0, 10) ?? null,
    gender: r.gender,
    addressStreet: r.addressStreet ?? "",
    addressNumber: r.addressNumber ?? "",
    addressComplement: r.addressComplement,
    addressDistrict: r.addressDistrict ?? "",
    addressCity: r.addressCity ?? "",
    addressState: r.addressState ?? "",
    addressZip: r.addressZip ?? "",
    notes: r.notes,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    vehicles: r.vehicles.map((v) => ({
      id: v.id,
      tenantId: v.tenantId,
      clientId: v.clientId,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      yearManufacture: v.yearManufacture,
      yearModel: v.yearModel,
      color: v.color,
      currentKm: v.currentKm,
      chassis: v.chassis,
      fuel: v.fuel,
      transmission: v.transmission,
      engine: v.engine,
      power: v.power,
      engineCode: v.engineCode,
      notes: v.notes,
      isActive: v.isActive,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
      documents: v.documents.map((d) => ({
        id: d.id,
        tenantId: d.tenantId,
        vehicleId: d.vehicleId,
        name: d.name,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        sizeBytes: d.sizeBytes,
        createdAt: d.createdAt.toISOString(),
      })),
      maintenancePlans: v.maintenancePlans.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        vehicleId: p.vehicleId,
        maintenanceTypeId: p.maintenanceTypeId,
        lastServiceAt: p.lastServiceAt?.toISOString() ?? null,
        lastServiceKm: p.lastServiceKm,
        nextDueAt: p.nextDueAt?.toISOString() ?? null,
        nextDueKm: p.nextDueKm,
        intervalKm: p.intervalKm,
        intervalDays: p.intervalDays,
        notes: p.notes,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        maintenanceType: p.maintenanceType,
      })),
    })),
  };
}

export async function createClient(
  tenantId: string,
  input: ClientFormInput
): Promise<ClientRecord> {
  const ts = new Date().toISOString();
  const document = onlyDigits(input.document);
  const whatsapp = onlyDigits(input.whatsapp);
  const addressZip = onlyDigits(input.addressZip);

  if (isDemoMode()) {
    const store = getDemoStore();
    const record: ClientRecord = {
      id: newId(),
      tenantId: tenantId || DEMO_TENANT_ID,
      name: input.name.trim(),
      document,
      whatsapp,
      email: input.email?.trim() || null,
      birthDate: input.birthDate || null,
      gender: input.gender,
      addressStreet: input.addressStreet.trim(),
      addressNumber: input.addressNumber.trim(),
      addressComplement: input.addressComplement?.trim() || null,
      addressDistrict: input.addressDistrict.trim(),
      addressCity: input.addressCity.trim(),
      addressState: input.addressState,
      addressZip,
      notes: input.notes?.trim() || null,
      status: input.status,
      createdAt: ts,
      updatedAt: ts,
    };
    store.clients.unshift(record);
    return record;
  }

  const r = await prisma.client.create({
    data: {
      tenantId,
      name: input.name.trim(),
      document,
      whatsapp,
      email: input.email?.trim() || null,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      gender: input.gender,
      addressStreet: input.addressStreet.trim(),
      addressNumber: input.addressNumber.trim(),
      addressComplement: input.addressComplement?.trim() || null,
      addressDistrict: input.addressDistrict.trim(),
      addressCity: input.addressCity.trim(),
      addressState: input.addressState,
      addressZip,
      notes: input.notes?.trim() || null,
      status: input.status,
    },
  });

  return mapPrismaClient(r);
}

export async function updateClient(
  tenantId: string,
  id: string,
  input: ClientFormInput
): Promise<ClientRecord | null> {
  const document = onlyDigits(input.document);
  const whatsapp = onlyDigits(input.whatsapp);
  const addressZip = onlyDigits(input.addressZip);

  if (isDemoMode()) {
    const store = getDemoStore();
    const idx = store.clients.findIndex(
      (c) => c.id === id && c.tenantId === tenantId
    );
    if (idx < 0) return null;
    const updated: ClientRecord = {
      ...store.clients[idx],
      name: input.name.trim(),
      document,
      whatsapp,
      email: input.email?.trim() || null,
      birthDate: input.birthDate || null,
      gender: input.gender,
      addressStreet: input.addressStreet.trim(),
      addressNumber: input.addressNumber.trim(),
      addressComplement: input.addressComplement?.trim() || null,
      addressDistrict: input.addressDistrict.trim(),
      addressCity: input.addressCity.trim(),
      addressState: input.addressState,
      addressZip,
      notes: input.notes?.trim() || null,
      status: input.status,
      updatedAt: new Date().toISOString(),
    };
    store.clients[idx] = updated;
    return updated;
  }

  const existing = await prisma.client.findFirst({ where: { id, tenantId } });
  if (!existing) return null;

  const r = await prisma.client.update({
    where: { id },
    data: {
      name: input.name.trim(),
      document,
      whatsapp,
      email: input.email?.trim() || null,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      gender: input.gender,
      addressStreet: input.addressStreet.trim(),
      addressNumber: input.addressNumber.trim(),
      addressComplement: input.addressComplement?.trim() || null,
      addressDistrict: input.addressDistrict.trim(),
      addressCity: input.addressCity.trim(),
      addressState: input.addressState,
      addressZip,
      notes: input.notes?.trim() || null,
      status: input.status,
    },
  });

  return mapPrismaClient(r);
}

export async function deleteClient(
  tenantId: string,
  id: string
): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore();
    const vehicles = store.vehicles.filter((v) => v.clientId === id);
    if (vehicles.length > 0) {
      throw new Error(
        "Não é possível excluir cliente com veículos vinculados. Inative o cliente ou remova os veículos."
      );
    }
    const before = store.clients.length;
    store.clients = store.clients.filter(
      (c) => !(c.id === id && c.tenantId === tenantId)
    );
    return store.clients.length < before;
  }

  const existing = await prisma.client.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { vehicles: true } } },
  });
  if (!existing) return false;
  if (existing._count.vehicles > 0) {
    throw new Error(
      "Não é possível excluir cliente com veículos vinculados. Inative o cliente ou remova os veículos."
    );
  }
  await prisma.client.delete({ where: { id } });
  return true;
}

function mapPrismaClient(r: {
  id: string;
  tenantId: string;
  name: string;
  document: string | null;
  whatsapp: string | null;
  email: string | null;
  birthDate: Date | null;
  gender: ClientRecord["gender"];
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  notes: string | null;
  status: ClientRecord["status"];
  createdAt: Date;
  updatedAt: Date;
}): ClientRecord {
  return {
    id: r.id,
    tenantId: r.tenantId,
    name: r.name,
    document: r.document ?? "",
    whatsapp: r.whatsapp ?? "",
    email: r.email,
    birthDate: r.birthDate?.toISOString().slice(0, 10) ?? null,
    gender: r.gender,
    addressStreet: r.addressStreet ?? "",
    addressNumber: r.addressNumber ?? "",
    addressComplement: r.addressComplement,
    addressDistrict: r.addressDistrict ?? "",
    addressCity: r.addressCity ?? "",
    addressState: r.addressState ?? "",
    addressZip: r.addressZip ?? "",
    notes: r.notes,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
