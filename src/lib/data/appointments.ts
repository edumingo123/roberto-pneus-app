import { isDemoMode } from "@/lib/auth/session";
import { getDemoStore, newId } from "./demo-store";
import type {
  AppointmentDetail,
  AppointmentRecord,
  AppointmentStatus,
} from "./types";

export interface AppointmentFormInput {
  clientId: string;
  vehicleId?: string | null;
  mechanicId?: string | null;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
  createdByAi?: boolean;
  status?: AppointmentStatus;
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Prevents same mechanic double-booking (active appointments only).
 */
export function hasMechanicConflict(params: {
  tenantId: string;
  mechanicId: string;
  startsAt: string;
  endsAt: string;
  excludeId?: string;
}): boolean {
  if (isDemoMode()) {
    const store = getDemoStore();
    const start = new Date(params.startsAt);
    const end = new Date(params.endsAt);
    return store.appointments.some((a) => {
      if (a.tenantId !== params.tenantId) return false;
      if (a.mechanicId !== params.mechanicId) return false;
      if (params.excludeId && a.id === params.excludeId) return false;
      if (a.status === "CANCELADO" || a.status === "NAO_COMPARECEU") {
        return false;
      }
      return overlaps(start, end, new Date(a.startsAt), new Date(a.endsAt));
    });
  }
  // Prisma path would query overlapping ranges
  return false;
}

function enrich(
  a: AppointmentRecord,
  store: ReturnType<typeof getDemoStore>
): AppointmentDetail {
  const client = store.clients.find((c) => c.id === a.clientId)!;
  const vehicle = a.vehicleId
    ? store.vehicles.find((v) => v.id === a.vehicleId) ?? null
    : null;
  const mechanic = a.mechanicId
    ? store.users.find((u) => u.id === a.mechanicId) ?? null
    : null;

  return {
    ...a,
    client: {
      id: client.id,
      name: client.name,
      whatsapp: client.whatsapp,
      document: client.document,
    },
    vehicle: vehicle
      ? {
          id: vehicle.id,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          color: vehicle.color,
          currentKm: vehicle.currentKm,
        }
      : null,
    mechanic: mechanic
      ? {
          id: mechanic.id,
          name: mechanic.name,
          avatarUrl: mechanic.avatarUrl,
          specialty: mechanic.specialty,
        }
      : null,
  };
}

export async function listAppointments(params: {
  tenantId: string;
  mechanicId?: string;
  status?: AppointmentStatus | "TODOS";
  from?: string;
  to?: string;
}): Promise<AppointmentDetail[]> {
  if (!isDemoMode()) {
    // Fallback empty when no DB — production uses Prisma in later wiring
    return listAppointmentsDemo(params);
  }
  return listAppointmentsDemo(params);
}

function listAppointmentsDemo(params: {
  tenantId: string;
  mechanicId?: string;
  status?: AppointmentStatus | "TODOS";
  from?: string;
  to?: string;
}): AppointmentDetail[] {
  const store = getDemoStore();
  let items = store.appointments.filter((a) => a.tenantId === params.tenantId);

  if (params.mechanicId && params.mechanicId !== "TODOS") {
    items = items.filter((a) => a.mechanicId === params.mechanicId);
  }
  if (params.status && params.status !== "TODOS") {
    items = items.filter((a) => a.status === params.status);
  }
  if (params.from) {
    const from = new Date(params.from).getTime();
    items = items.filter((a) => new Date(a.endsAt).getTime() >= from);
  }
  if (params.to) {
    const to = new Date(params.to).getTime();
    items = items.filter((a) => new Date(a.startsAt).getTime() <= to);
  }

  return items
    .map((a) => enrich(a, store))
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
}

export async function getAppointmentById(
  tenantId: string,
  id: string
): Promise<AppointmentDetail | null> {
  const store = getDemoStore();
  const a = store.appointments.find(
    (x) => x.id === id && x.tenantId === tenantId
  );
  return a ? enrich(a, store) : null;
}

export async function getAppointmentByPublicToken(
  token: string
): Promise<AppointmentDetail | null> {
  const store = getDemoStore();
  const a = store.appointments.find((x) => x.publicToken === token);
  return a ? enrich(a, store) : null;
}

export async function createAppointment(
  tenantId: string,
  input: AppointmentFormInput
): Promise<AppointmentRecord> {
  const store = getDemoStore();
  const start = new Date(input.startsAt);
  const end = new Date(input.endsAt);
  if (!(end > start)) throw new Error("Horário final deve ser após o início");

  const client = store.clients.find(
    (c) => c.id === input.clientId && c.tenantId === tenantId
  );
  if (!client) throw new Error("Cliente não encontrado");

  if (input.vehicleId) {
    const v = store.vehicles.find(
      (x) =>
        x.id === input.vehicleId &&
        x.tenantId === tenantId &&
        x.clientId === input.clientId
    );
    if (!v) throw new Error("Veículo inválido para este cliente");
  }

  if (input.mechanicId) {
    if (
      hasMechanicConflict({
        tenantId,
        mechanicId: input.mechanicId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      })
    ) {
      throw new Error(
        "Conflito: este mecânico já possui agendamento neste horário"
      );
    }
  }

  const status: AppointmentStatus =
    input.status ??
    (input.createdByAi ? "AGUARDANDO_APROVACAO" : "CONFIRMADO");

  const ts = new Date().toISOString();
  const record: AppointmentRecord = {
    id: newId(),
    tenantId,
    clientId: input.clientId,
    vehicleId: input.vehicleId || null,
    mechanicId: input.mechanicId || null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    status,
    createdByAi: !!input.createdByAi,
    publicToken:
      status === "CONFIRMADO" || status === "EM_ANDAMENTO"
        ? `pub-appt-${newId().slice(0, 10)}`
        : null,
    notes: input.notes?.trim() || null,
    serviceOrderId: null,
    createdAt: ts,
    updatedAt: ts,
  };

  store.appointments.push(record);
  return record;
}

export async function updateAppointment(
  tenantId: string,
  id: string,
  input: AppointmentFormInput
): Promise<AppointmentRecord | null> {
  const store = getDemoStore();
  const idx = store.appointments.findIndex(
    (a) => a.id === id && a.tenantId === tenantId
  );
  if (idx < 0) return null;

  const start = new Date(input.startsAt);
  const end = new Date(input.endsAt);
  if (!(end > start)) throw new Error("Horário final deve ser após o início");

  if (input.mechanicId) {
    if (
      hasMechanicConflict({
        tenantId,
        mechanicId: input.mechanicId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        excludeId: id,
      })
    ) {
      throw new Error(
        "Conflito: este mecânico já possui agendamento neste horário"
      );
    }
  }

  const prev = store.appointments[idx];
  const updated: AppointmentRecord = {
    ...prev,
    clientId: input.clientId,
    vehicleId: input.vehicleId || null,
    mechanicId: input.mechanicId || null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    notes: input.notes?.trim() || null,
    updatedAt: new Date().toISOString(),
  };
  store.appointments[idx] = updated;
  return updated;
}

export async function setAppointmentStatus(
  tenantId: string,
  id: string,
  status: AppointmentStatus
): Promise<AppointmentRecord | null> {
  const store = getDemoStore();
  const idx = store.appointments.findIndex(
    (a) => a.id === id && a.tenantId === tenantId
  );
  if (idx < 0) return null;

  const prev = store.appointments[idx];
  let publicToken = prev.publicToken;
  if (
    (status === "CONFIRMADO" || status === "EM_ANDAMENTO") &&
    !publicToken
  ) {
    publicToken = `pub-appt-${newId().slice(0, 10)}`;
  }

  const updated: AppointmentRecord = {
    ...prev,
    status,
    publicToken,
    updatedAt: new Date().toISOString(),
  };
  store.appointments[idx] = updated;
  return updated;
}

export async function listMechanicOptions(tenantId: string) {
  return getDemoStore()
    .users.filter(
      (u) =>
        u.tenantId === tenantId &&
        u.isActive &&
        (u.role === "MECANICO" || u.role === "ADMIN")
    )
    .map((u) => ({
      id: u.id,
      name: u.name,
      specialty: u.specialty,
      avatarUrl: u.avatarUrl,
      role: u.role,
    }));
}

export function getMechanicDaySlots(params: {
  tenantId: string;
  mechanicId: string;
  date: string; // YYYY-MM-DD
  excludeId?: string;
}): { hour: number; minute: number; free: boolean }[] {
  const slots: { hour: number; minute: number; free: boolean }[] = [];
  for (let h = 8; h < 18; h++) {
    for (const m of [0, 30]) {
      const start = new Date(`${params.date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const free = !hasMechanicConflict({
        tenantId: params.tenantId,
        mechanicId: params.mechanicId,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        excludeId: params.excludeId,
      });
      slots.push({ hour: h, minute: m, free });
    }
  }
  return slots;
}
