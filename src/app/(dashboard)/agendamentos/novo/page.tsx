import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import {
  getMechanicDaySlots,
  listMechanicOptions,
} from "@/lib/data/appointments";
import { listClientOptions } from "@/lib/data/vehicles";
import { getDemoStore } from "@/lib/data/demo-store";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { formatPlate } from "@/lib/format";

export const metadata: Metadata = { title: "Novo agendamento" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    startTime?: string;
    clientId?: string;
    mechanicId?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await resolveSession();
  const tenantId = session.user.tenantId;
  const store = getDemoStore();

  const clients = await listClientOptions(tenantId);
  const mechanics = await listMechanicOptions(tenantId);
  const vehicles = store.vehicles
    .filter((v) => v.tenantId === tenantId && v.isActive)
    .map((v) => ({
      id: v.id,
      clientId: v.clientId,
      plate: formatPlate(v.plate),
      label: `${v.brand} ${v.model}`,
    }));

  const date = params.date || new Date().toISOString().slice(0, 10);
  const mechanicId = params.mechanicId || mechanics[0]?.id || "";
  const slots = mechanicId
    ? getMechanicDaySlots({ tenantId, mechanicId, date })
    : [];

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/agendamentos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h2 className="text-xl md:text-2xl font-bold">Novo agendamento</h2>
        <p className="text-sm text-muted-foreground">
          Conflitos de horário do mecânico são validados automaticamente
        </p>
      </div>
      <AppointmentForm
        clients={clients}
        vehicles={vehicles}
        mechanics={mechanics}
        slots={slots}
        defaultDate={params.date}
        defaultStartTime={params.startTime}
        defaultClientId={params.clientId}
      />
    </div>
  );
}
