import { isDemoMode } from "@/lib/auth/session";
import { getDemoStore, newId } from "./demo-store";
import { updateVehicleKm } from "./vehicles";
import {
  canTransition,
  osStatusLabel,
  requiresExitKm,
} from "@/lib/service-orders/status";
import { paginate, parsePage } from "@/lib/utils/pagination";
import type {
  PaginatedResult,
  PhotoType,
  ServiceOrderDetail,
  ServiceOrderLaborRecord,
  ServiceOrderListItem,
  ServiceOrderPartRecord,
  ServiceOrderPhotoRecord,
  ServiceOrderRecord,
  ServiceOrderStatus,
} from "./types";

export interface CreateServiceOrderInput {
  clientId: string;
  vehicleId: string;
  mechanicId?: string | null;
  kmAtEntry: number;
  complaint?: string | null;
  diagnosis?: string | null;
  internalNotes?: string | null;
  createdById?: string | null;
}

export interface UpdateServiceOrderInfoInput {
  mechanicId?: string | null;
  complaint?: string | null;
  diagnosis?: string | null;
  internalNotes?: string | null;
  discount?: number;
  estimatedReady?: string | null;
}

function recalcTotals(osId: string) {
  const store = getDemoStore();
  const parts = store.serviceOrderParts.filter((p) => p.serviceOrderId === osId);
  const labor = store.serviceOrderLabor.filter((l) => l.serviceOrderId === osId);
  const partsTotal = parts.reduce((s, p) => s + p.totalPrice, 0);
  const laborTotal = labor.reduce((s, l) => s + l.totalPrice, 0);
  const idx = store.serviceOrders.findIndex((o) => o.id === osId);
  if (idx < 0) return;
  const discount = store.serviceOrders[idx].discount || 0;
  store.serviceOrders[idx] = {
    ...store.serviceOrders[idx],
    partsTotal,
    laborTotal,
    grandTotal: Math.max(0, partsTotal + laborTotal - discount),
    updatedAt: new Date().toISOString(),
  };
}

function enrichListItem(
  o: ServiceOrderRecord,
  store: ReturnType<typeof getDemoStore>
): ServiceOrderListItem {
  const client = store.clients.find((c) => c.id === o.clientId);
  const vehicle = store.vehicles.find((v) => v.id === o.vehicleId);
  const mechanic = o.mechanicId
    ? store.users.find((u) => u.id === o.mechanicId)
    : null;
  return {
    ...o,
    clientName: client?.name ?? "—",
    vehiclePlate: vehicle?.plate ?? "—",
    vehicleLabel: vehicle ? `${vehicle.brand} ${vehicle.model}` : "—",
    mechanicName: mechanic?.name ?? null,
  };
}

function enrichDetail(
  o: ServiceOrderRecord,
  store: ReturnType<typeof getDemoStore>
): ServiceOrderDetail {
  const client = store.clients.find((c) => c.id === o.clientId)!;
  const vehicle = store.vehicles.find((v) => v.id === o.vehicleId)!;
  const mechanic = o.mechanicId
    ? store.users.find((u) => u.id === o.mechanicId) ?? null
    : null;

  return {
    ...o,
    client: {
      id: client.id,
      name: client.name,
      whatsapp: client.whatsapp,
      document: client.document,
      email: client.email,
    },
    vehicle: {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      yearModel: vehicle.yearModel,
      currentKm: vehicle.currentKm,
    },
    mechanic: mechanic
      ? {
          id: mechanic.id,
          name: mechanic.name,
          avatarUrl: mechanic.avatarUrl,
          specialty: mechanic.specialty,
        }
      : null,
    parts: store.serviceOrderParts
      .filter((p) => p.serviceOrderId === o.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    laborItems: store.serviceOrderLabor
      .filter((l) => l.serviceOrderId === o.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    photos: store.serviceOrderPhotos
      .filter((p) => p.serviceOrderId === o.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    statusHistory: store.serviceOrderHistory
      .filter((h) => h.serviceOrderId === o.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
  };
}

export async function listServiceOrders(params: {
  tenantId: string;
  q?: string;
  status?: ServiceOrderStatus | "TODOS";
  mechanicId?: string;
  page?: number | string;
}): Promise<PaginatedResult<ServiceOrderListItem>> {
  const store = getDemoStore();
  let items = store.serviceOrders.filter((o) => o.tenantId === params.tenantId);

  if (params.status && params.status !== "TODOS") {
    items = items.filter((o) => o.status === params.status);
  }
  if (params.mechanicId && params.mechanicId !== "TODOS") {
    items = items.filter((o) => o.mechanicId === params.mechanicId);
  }
  if (params.q?.trim()) {
    const q = params.q.trim().toUpperCase();
    const digits = q.replace(/\D/g, "");
    items = items.filter((o) => {
      const vehicle = store.vehicles.find((v) => v.id === o.vehicleId);
      const client = store.clients.find((c) => c.id === o.clientId);
      return (
        String(o.number).includes(digits || q) ||
        (vehicle?.plate.includes(q.replace(/[^A-Z0-9]/g, "")) ?? false) ||
        (client?.name.toUpperCase().includes(q) ?? false)
      );
    });
  }

  items.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const page = parsePage(params.page);
  const mapped = items.map((o) => enrichListItem(o, store));
  return paginate(mapped, page);
}

export async function getServiceOrderById(
  tenantId: string,
  id: string
): Promise<ServiceOrderDetail | null> {
  const store = getDemoStore();
  const o = store.serviceOrders.find(
    (x) => x.id === id && x.tenantId === tenantId
  );
  return o ? enrichDetail(o, store) : null;
}

export async function getServiceOrderByPublicToken(
  token: string
): Promise<ServiceOrderDetail | null> {
  const store = getDemoStore();
  const o = store.serviceOrders.find((x) => x.publicToken === token);
  return o ? enrichDetail(o, store) : null;
}

export async function createServiceOrder(
  tenantId: string,
  input: CreateServiceOrderInput
): Promise<ServiceOrderRecord> {
  if (input.kmAtEntry < 0 || !Number.isFinite(input.kmAtEntry)) {
    throw new Error("Informe a KM atual do veículo");
  }

  const store = getDemoStore();
  const client = store.clients.find(
    (c) => c.id === input.clientId && c.tenantId === tenantId
  );
  if (!client) throw new Error("Cliente não encontrado");

  const vehicle = store.vehicles.find(
    (v) =>
      v.id === input.vehicleId &&
      v.tenantId === tenantId &&
      v.clientId === input.clientId
  );
  if (!vehicle) throw new Error("Veículo inválido para este cliente");

  // Critical: update vehicle KM on OS creation
  await updateVehicleKm(tenantId, vehicle.id, input.kmAtEntry);

  const ts = new Date().toISOString();
  const number = store.nextOsNumber++;
  const record: ServiceOrderRecord = {
    id: newId(),
    tenantId,
    number,
    clientId: input.clientId,
    vehicleId: input.vehicleId,
    mechanicId: input.mechanicId || null,
    createdById: input.createdById || null,
    status: "ORCAMENTO",
    kmAtEntry: input.kmAtEntry,
    kmAtExit: null,
    complaint: input.complaint?.trim() || null,
    diagnosis: input.diagnosis?.trim() || null,
    internalNotes: input.internalNotes?.trim() || null,
    discount: 0,
    partsTotal: 0,
    laborTotal: 0,
    grandTotal: 0,
    publicToken: `pub-os-${newId().slice(0, 12)}`,
    estimatedReady: null,
    approvedAt: null,
    startedAt: null,
    finishedAt: null,
    deliveredAt: null,
    createdAt: ts,
    updatedAt: ts,
  };

  store.serviceOrders.unshift(record);

  const creator = input.createdById
    ? store.users.find((u) => u.id === input.createdById)
    : null;

  store.serviceOrderHistory.push({
    id: newId(),
    serviceOrderId: record.id,
    fromStatus: null,
    toStatus: "ORCAMENTO",
    changedById: input.createdById || null,
    changedByName: creator?.name ?? null,
    notes: "OS aberta",
    createdAt: ts,
  });

  return record;
}

export async function updateServiceOrderInfo(
  tenantId: string,
  id: string,
  input: UpdateServiceOrderInfoInput
): Promise<ServiceOrderRecord | null> {
  const store = getDemoStore();
  const idx = store.serviceOrders.findIndex(
    (o) => o.id === id && o.tenantId === tenantId
  );
  if (idx < 0) return null;

  store.serviceOrders[idx] = {
    ...store.serviceOrders[idx],
    mechanicId:
      input.mechanicId !== undefined
        ? input.mechanicId
        : store.serviceOrders[idx].mechanicId,
    complaint:
      input.complaint !== undefined
        ? input.complaint?.trim() || null
        : store.serviceOrders[idx].complaint,
    diagnosis:
      input.diagnosis !== undefined
        ? input.diagnosis?.trim() || null
        : store.serviceOrders[idx].diagnosis,
    internalNotes:
      input.internalNotes !== undefined
        ? input.internalNotes?.trim() || null
        : store.serviceOrders[idx].internalNotes,
    discount:
      input.discount !== undefined
        ? input.discount
        : store.serviceOrders[idx].discount,
    estimatedReady:
      input.estimatedReady !== undefined
        ? input.estimatedReady
        : store.serviceOrders[idx].estimatedReady,
    updatedAt: new Date().toISOString(),
  };
  recalcTotals(id);
  return store.serviceOrders[idx];
}

export async function transitionServiceOrderStatus(params: {
  tenantId: string;
  id: string;
  toStatus: ServiceOrderStatus;
  changedById?: string | null;
  notes?: string | null;
  kmAtExit?: number | null;
}): Promise<ServiceOrderDetail> {
  const store = getDemoStore();
  const idx = store.serviceOrders.findIndex(
    (o) => o.id === params.id && o.tenantId === params.tenantId
  );
  if (idx < 0) throw new Error("OS não encontrada");

  const current = store.serviceOrders[idx];
  if (!canTransition(current.status, params.toStatus)) {
    throw new Error(
      `Transição inválida: ${osStatusLabel(current.status)} → ${osStatusLabel(params.toStatus)}`
    );
  }

  if (requiresExitKm(params.toStatus)) {
    if (
      params.kmAtExit == null ||
      !Number.isFinite(params.kmAtExit) ||
      params.kmAtExit < 0
    ) {
      throw new Error("Informe a KM atual do veículo para finalizar a entrega");
    }
    if (params.kmAtExit < current.kmAtEntry) {
      throw new Error("KM de saída não pode ser menor que a KM de entrada");
    }
    await updateVehicleKm(
      params.tenantId,
      current.vehicleId,
      params.kmAtExit
    );
  }

  const ts = new Date().toISOString();
  const changer = params.changedById
    ? store.users.find((u) => u.id === params.changedById)
    : null;

  const updated: ServiceOrderRecord = {
    ...current,
    status: params.toStatus,
    kmAtExit:
      params.kmAtExit != null ? params.kmAtExit : current.kmAtExit,
    approvedAt:
      params.toStatus === "APROVADO" ? ts : current.approvedAt,
    startedAt:
      params.toStatus === "EM_EXECUCAO" ? ts : current.startedAt,
    finishedAt:
      params.toStatus === "PRONTO_RETIRADA" || params.toStatus === "ENTREGUE"
        ? ts
        : current.finishedAt,
    deliveredAt: params.toStatus === "ENTREGUE" ? ts : current.deliveredAt,
    updatedAt: ts,
  };

  store.serviceOrders[idx] = updated;

  store.serviceOrderHistory.push({
    id: newId(),
    serviceOrderId: current.id,
    fromStatus: current.status,
    toStatus: params.toStatus,
    changedById: params.changedById || null,
    changedByName: changer?.name ?? null,
    notes: params.notes?.trim() || null,
    createdAt: ts,
  });

  return enrichDetail(updated, store);
}

export async function setParts(
  tenantId: string,
  osId: string,
  parts: Array<{
    id?: string;
    description: string;
    brand?: string | null;
    quantity: number;
    unitPrice: number;
  }>
): Promise<ServiceOrderPartRecord[]> {
  const store = getDemoStore();
  const os = store.serviceOrders.find(
    (o) => o.id === osId && o.tenantId === tenantId
  );
  if (!os) throw new Error("OS não encontrada");

  store.serviceOrderParts = store.serviceOrderParts.filter(
    (p) => p.serviceOrderId !== osId
  );
  const ts = new Date().toISOString();
  const created = parts.map((p) => {
    const qty = Number(p.quantity) || 0;
    const unit = Number(p.unitPrice) || 0;
    const rec: ServiceOrderPartRecord = {
      id: p.id || newId(),
      serviceOrderId: osId,
      description: p.description.trim(),
      brand: p.brand?.trim() || null,
      quantity: qty,
      unitPrice: unit,
      totalPrice: Math.round(qty * unit * 100) / 100,
      createdAt: ts,
      updatedAt: ts,
    };
    return rec;
  });
  store.serviceOrderParts.push(...created);
  recalcTotals(osId);
  return created;
}

export async function setLabor(
  tenantId: string,
  osId: string,
  items: Array<{
    id?: string;
    description: string;
    hours: number;
    hourlyRate: number;
  }>
): Promise<ServiceOrderLaborRecord[]> {
  const store = getDemoStore();
  const os = store.serviceOrders.find(
    (o) => o.id === osId && o.tenantId === tenantId
  );
  if (!os) throw new Error("OS não encontrada");

  store.serviceOrderLabor = store.serviceOrderLabor.filter(
    (l) => l.serviceOrderId !== osId
  );
  const ts = new Date().toISOString();
  const created = items.map((p) => {
    const hours = Number(p.hours) || 0;
    const rate = Number(p.hourlyRate) || 0;
    const rec: ServiceOrderLaborRecord = {
      id: p.id || newId(),
      serviceOrderId: osId,
      description: p.description.trim(),
      hours,
      hourlyRate: rate,
      totalPrice: Math.round(hours * rate * 100) / 100,
      createdAt: ts,
      updatedAt: ts,
    };
    return rec;
  });
  store.serviceOrderLabor.push(...created);
  recalcTotals(osId);
  return created;
}

export async function addServiceOrderPhoto(
  tenantId: string,
  osId: string,
  photo: { url: string; caption: string; type: PhotoType }
): Promise<ServiceOrderPhotoRecord> {
  const store = getDemoStore();
  const os = store.serviceOrders.find(
    (o) => o.id === osId && o.tenantId === tenantId
  );
  if (!os) throw new Error("OS não encontrada");
  if (!photo.caption.trim()) throw new Error("Informe a legenda da foto");

  const rec: ServiceOrderPhotoRecord = {
    id: newId(),
    serviceOrderId: osId,
    url: photo.url,
    caption: photo.caption.trim(),
    type: photo.type,
    createdAt: new Date().toISOString(),
  };
  store.serviceOrderPhotos.push(rec);
  return rec;
}

export async function deleteServiceOrderPhoto(
  tenantId: string,
  photoId: string
): Promise<boolean> {
  const store = getDemoStore();
  const photo = store.serviceOrderPhotos.find((p) => p.id === photoId);
  if (!photo) return false;
  const os = store.serviceOrders.find(
    (o) => o.id === photo.serviceOrderId && o.tenantId === tenantId
  );
  if (!os) return false;
  store.serviceOrderPhotos = store.serviceOrderPhotos.filter(
    (p) => p.id !== photoId
  );
  return true;
}

// silence unused isDemoMode until Prisma paths land fully
void isDemoMode;
