import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/auth/session";
import { sanitizePlate } from "@/lib/validations/vehicle";
import { paginate, parsePage } from "@/lib/utils/pagination";
import { getDemoStore, newId } from "./demo-store";
import type {
  FuelType,
  PaginatedResult,
  TransmissionType,
  VehicleDocumentRecord,
  VehicleRecord,
  VehicleWithClient,
} from "./types";

export interface VehicleFormInput {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  yearManufacture: number;
  yearModel: number;
  color: string;
  currentKm: number;
  chassis?: string | null;
  fuel?: FuelType | "" | null;
  transmission?: TransmissionType | "" | null;
  engine?: string | null;
  power?: string | null;
  engineCode?: string | null;
  notes?: string | null;
}

export interface ListVehiclesParams {
  tenantId: string;
  q?: string;
  clientId?: string;
  page?: number | string;
}

export async function listVehicles(
  params: ListVehiclesParams
): Promise<PaginatedResult<VehicleWithClient>> {
  const page = parsePage(params.page);
  const q = params.q?.trim().toUpperCase() ?? "";

  if (isDemoMode()) {
    const store = getDemoStore();
    let items = store.vehicles.filter(
      (v) => v.tenantId === params.tenantId && v.isActive
    );
    if (params.clientId) {
      items = items.filter((v) => v.clientId === params.clientId);
    }
    if (q) {
      items = items.filter((v) => {
        const client = store.clients.find((c) => c.id === v.clientId);
        return (
          v.plate.includes(q.replace(/[^A-Z0-9]/g, "")) ||
          v.brand.toUpperCase().includes(q) ||
          v.model.toUpperCase().includes(q) ||
          (client?.name.toUpperCase().includes(q) ?? false)
        );
      });
    }
    items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const mapped: VehicleWithClient[] = items.map((v) => {
      const client = store.clients.find((c) => c.id === v.clientId)!;
      return {
        ...v,
        client: {
          id: client.id,
          name: client.name,
          whatsapp: client.whatsapp,
          document: client.document,
        },
        documents: store.vehicleDocuments.filter((d) => d.vehicleId === v.id),
      };
    });

    return paginate(mapped, page);
  }

  const where = {
    tenantId: params.tenantId,
    isActive: true,
    ...(params.clientId ? { clientId: params.clientId } : {}),
    ...(q
      ? {
          OR: [
            { plate: { contains: q.replace(/[^A-Z0-9]/gi, ""), mode: "insensitive" as const } },
            { brand: { contains: q, mode: "insensitive" as const } },
            { model: { contains: q, mode: "insensitive" as const } },
            { client: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, whatsapp: true, document: true },
        },
        documents: true,
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * 10,
      take: 10,
    }),
  ]);

  return {
    items: rows.map(mapVehicleWithClient),
    total,
    page,
    pageSize: 10,
    totalPages: Math.max(1, Math.ceil(total / 10)),
  };
}

export async function getVehicleById(
  tenantId: string,
  id: string
): Promise<VehicleWithClient | null> {
  if (isDemoMode()) {
    const store = getDemoStore();
    const v = store.vehicles.find((x) => x.id === id && x.tenantId === tenantId);
    if (!v) return null;
    const client = store.clients.find((c) => c.id === v.clientId);
    if (!client) return null;
    return {
      ...v,
      client: {
        id: client.id,
        name: client.name,
        whatsapp: client.whatsapp,
        document: client.document,
      },
      documents: store.vehicleDocuments.filter((d) => d.vehicleId === v.id),
    };
  }

  const r = await prisma.vehicle.findFirst({
    where: { id, tenantId },
    include: {
      client: {
        select: { id: true, name: true, whatsapp: true, document: true },
      },
      documents: true,
    },
  });
  return r ? mapVehicleWithClient(r) : null;
}

export async function createVehicle(
  tenantId: string,
  input: VehicleFormInput
): Promise<VehicleRecord> {
  const plate = sanitizePlate(input.plate);
  const ts = new Date().toISOString();

  if (isDemoMode()) {
    const store = getDemoStore();
    const client = store.clients.find(
      (c) => c.id === input.clientId && c.tenantId === tenantId
    );
    if (!client) throw new Error("Cliente não encontrado neste tenant");
    if (store.vehicles.some((v) => v.tenantId === tenantId && v.plate === plate)) {
      throw new Error("Já existe veículo com esta placa");
    }

    const record: VehicleRecord = {
      id: newId(),
      tenantId,
      clientId: input.clientId,
      plate,
      brand: input.brand.trim(),
      model: input.model.trim(),
      yearManufacture: input.yearManufacture,
      yearModel: input.yearModel,
      color: input.color.trim(),
      currentKm: input.currentKm,
      chassis: input.chassis?.trim() || null,
      fuel: (input.fuel as FuelType) || null,
      transmission: (input.transmission as TransmissionType) || null,
      engine: input.engine?.trim() || null,
      power: input.power?.trim() || null,
      engineCode: input.engineCode?.trim() || null,
      notes: input.notes?.trim() || null,
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    };
    store.vehicles.unshift(record);
    return record;
  }

  const client = await prisma.client.findFirst({
    where: { id: input.clientId, tenantId },
  });
  if (!client) throw new Error("Cliente não encontrado neste tenant");

  const r = await prisma.vehicle.create({
    data: {
      tenantId,
      clientId: input.clientId,
      plate,
      brand: input.brand.trim(),
      model: input.model.trim(),
      yearManufacture: input.yearManufacture,
      yearModel: input.yearModel,
      color: input.color.trim(),
      currentKm: input.currentKm,
      chassis: input.chassis?.trim() || null,
      fuel: input.fuel || null,
      transmission: input.transmission || null,
      engine: input.engine?.trim() || null,
      power: input.power?.trim() || null,
      engineCode: input.engineCode?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });

  return mapVehicle(r);
}

export async function updateVehicle(
  tenantId: string,
  id: string,
  input: VehicleFormInput
): Promise<VehicleRecord | null> {
  const plate = sanitizePlate(input.plate);

  if (isDemoMode()) {
    const store = getDemoStore();
    const idx = store.vehicles.findIndex(
      (v) => v.id === id && v.tenantId === tenantId
    );
    if (idx < 0) return null;
    const client = store.clients.find(
      (c) => c.id === input.clientId && c.tenantId === tenantId
    );
    if (!client) throw new Error("Cliente não encontrado neste tenant");
    if (
      store.vehicles.some(
        (v) => v.tenantId === tenantId && v.plate === plate && v.id !== id
      )
    ) {
      throw new Error("Já existe veículo com esta placa");
    }

    const updated: VehicleRecord = {
      ...store.vehicles[idx],
      clientId: input.clientId,
      plate,
      brand: input.brand.trim(),
      model: input.model.trim(),
      yearManufacture: input.yearManufacture,
      yearModel: input.yearModel,
      color: input.color.trim(),
      currentKm: input.currentKm,
      chassis: input.chassis?.trim() || null,
      fuel: (input.fuel as FuelType) || null,
      transmission: (input.transmission as TransmissionType) || null,
      engine: input.engine?.trim() || null,
      power: input.power?.trim() || null,
      engineCode: input.engineCode?.trim() || null,
      notes: input.notes?.trim() || null,
      updatedAt: new Date().toISOString(),
    };
    store.vehicles[idx] = updated;
    return updated;
  }

  const existing = await prisma.vehicle.findFirst({ where: { id, tenantId } });
  if (!existing) return null;

  const r = await prisma.vehicle.update({
    where: { id },
    data: {
      clientId: input.clientId,
      plate,
      brand: input.brand.trim(),
      model: input.model.trim(),
      yearManufacture: input.yearManufacture,
      yearModel: input.yearModel,
      color: input.color.trim(),
      currentKm: input.currentKm,
      chassis: input.chassis?.trim() || null,
      fuel: input.fuel || null,
      transmission: input.transmission || null,
      engine: input.engine?.trim() || null,
      power: input.power?.trim() || null,
      engineCode: input.engineCode?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });
  return mapVehicle(r);
}

/**
 * Critical business rule helper for Phase 3 OS:
 * always update vehicle KM when creating or finishing a service order.
 */
export async function updateVehicleKm(
  tenantId: string,
  vehicleId: string,
  km: number
): Promise<VehicleRecord | null> {
  if (km < 0) throw new Error("KM inválida");

  if (isDemoMode()) {
    const store = getDemoStore();
    const idx = store.vehicles.findIndex(
      (v) => v.id === vehicleId && v.tenantId === tenantId
    );
    if (idx < 0) return null;
    if (km < store.vehicles[idx].currentKm) {
      // allow equal or higher; warn but still update if explicitly set higher path
    }
    store.vehicles[idx] = {
      ...store.vehicles[idx],
      currentKm: km,
      updatedAt: new Date().toISOString(),
    };
    return store.vehicles[idx];
  }

  const existing = await prisma.vehicle.findFirst({
    where: { id: vehicleId, tenantId },
  });
  if (!existing) return null;

  const r = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { currentKm: km },
  });
  return mapVehicle(r);
}

export async function deleteVehicle(
  tenantId: string,
  id: string
): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore();
    const idx = store.vehicles.findIndex(
      (v) => v.id === id && v.tenantId === tenantId
    );
    if (idx < 0) return false;
    store.vehicles[idx] = {
      ...store.vehicles[idx],
      isActive: false,
      updatedAt: new Date().toISOString(),
    };
    store.maintenancePlans = store.maintenancePlans.filter(
      (p) => p.vehicleId !== id
    );
    store.vehicleDocuments = store.vehicleDocuments.filter(
      (d) => d.vehicleId !== id
    );
    return true;
  }

  const existing = await prisma.vehicle.findFirst({ where: { id, tenantId } });
  if (!existing) return false;
  await prisma.vehicle.update({
    where: { id },
    data: { isActive: false },
  });
  return true;
}

export async function addVehicleDocument(
  tenantId: string,
  vehicleId: string,
  doc: {
    name: string;
    fileUrl: string;
    fileType: string;
    sizeBytes?: number | null;
  }
): Promise<VehicleDocumentRecord> {
  const ts = new Date().toISOString();

  if (isDemoMode()) {
    const store = getDemoStore();
    const vehicle = store.vehicles.find(
      (v) => v.id === vehicleId && v.tenantId === tenantId
    );
    if (!vehicle) throw new Error("Veículo não encontrado");
    const record: VehicleDocumentRecord = {
      id: newId(),
      tenantId,
      vehicleId,
      name: doc.name,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
      sizeBytes: doc.sizeBytes ?? null,
      createdAt: ts,
    };
    store.vehicleDocuments.push(record);
    return record;
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, tenantId },
  });
  if (!vehicle) throw new Error("Veículo não encontrado");

  const r = await prisma.vehicleDocument.create({
    data: {
      tenantId,
      vehicleId,
      name: doc.name,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
      sizeBytes: doc.sizeBytes ?? null,
    },
  });

  return {
    id: r.id,
    tenantId: r.tenantId,
    vehicleId: r.vehicleId,
    name: r.name,
    fileUrl: r.fileUrl,
    fileType: r.fileType,
    sizeBytes: r.sizeBytes,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Removes a vehicle document (tenant-scoped).
 * Returns the deleted record so callers can clean Supabase Storage.
 */
export async function deleteVehicleDocument(
  tenantId: string,
  documentId: string
): Promise<VehicleDocumentRecord | null> {
  if (isDemoMode()) {
    const store = getDemoStore();
    const idx = store.vehicleDocuments.findIndex(
      (d) => d.id === documentId && d.tenantId === tenantId
    );
    if (idx < 0) return null;
    const [removed] = store.vehicleDocuments.splice(idx, 1);
    return removed;
  }

  const existing = await prisma.vehicleDocument.findFirst({
    where: { id: documentId, tenantId },
  });
  if (!existing) return null;

  await prisma.vehicleDocument.delete({ where: { id: documentId } });

  return {
    id: existing.id,
    tenantId: existing.tenantId,
    vehicleId: existing.vehicleId,
    name: existing.name,
    fileUrl: existing.fileUrl,
    fileType: existing.fileType,
    sizeBytes: existing.sizeBytes,
    createdAt: existing.createdAt.toISOString(),
  };
}

/** Extract storage object path from a Supabase public URL for vehicle-documents. */
export function extractVehicleDocumentStoragePath(
  fileUrl: string
): string | null {
  if (!fileUrl || fileUrl.startsWith("data:")) return null;
  const marker = "/storage/v1/object/public/vehicle-documents/";
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(fileUrl.slice(idx + marker.length).split("?")[0]);
}

export async function listClientOptions(tenantId: string) {
  if (isDemoMode()) {
    return getDemoStore()
      .clients.filter((c) => c.tenantId === tenantId && c.status === "ATIVO")
      .map((c) => ({ id: c.id, name: c.name, document: c.document }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const rows = await prisma.client.findMany({
    where: { tenantId, status: "ATIVO" },
    select: { id: true, name: true, document: true },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    document: r.document ?? "",
  }));
}

function mapVehicle(r: {
  id: string;
  tenantId: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  yearManufacture: number;
  yearModel: number;
  color: string;
  currentKm: number;
  chassis: string | null;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  engine: string | null;
  power: string | null;
  engineCode: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): VehicleRecord {
  return {
    id: r.id,
    tenantId: r.tenantId,
    clientId: r.clientId,
    plate: r.plate,
    brand: r.brand,
    model: r.model,
    yearManufacture: r.yearManufacture,
    yearModel: r.yearModel,
    color: r.color,
    currentKm: r.currentKm,
    chassis: r.chassis,
    fuel: r.fuel,
    transmission: r.transmission,
    engine: r.engine,
    power: r.power,
    engineCode: r.engineCode,
    notes: r.notes,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function mapVehicleWithClient(r: {
  id: string;
  tenantId: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  yearManufacture: number;
  yearModel: number;
  color: string;
  currentKm: number;
  chassis: string | null;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  engine: string | null;
  power: string | null;
  engineCode: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
    whatsapp: string | null;
    document: string | null;
  };
  documents?: Array<{
    id: string;
    tenantId: string;
    vehicleId: string;
    name: string;
    fileUrl: string;
    fileType: string;
    sizeBytes: number | null;
    createdAt: Date;
  }>;
}): VehicleWithClient {
  return {
    ...mapVehicle(r),
    client: {
      id: r.client.id,
      name: r.client.name,
      whatsapp: r.client.whatsapp ?? "",
      document: r.client.document ?? "",
    },
    documents:
      r.documents?.map((d) => ({
        id: d.id,
        tenantId: d.tenantId,
        vehicleId: d.vehicleId,
        name: d.name,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        sizeBytes: d.sizeBytes,
        createdAt: d.createdAt.toISOString(),
      })) ?? [],
  };
}
