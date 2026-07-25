import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listClientOptions } from "@/lib/data/vehicles";
import { listMechanicOptions } from "@/lib/data/appointments";
import { getDemoStore } from "@/lib/data/demo-store";
import { OsCreateForm } from "@/components/service-orders/os-create-form";
import { formatPlate } from "@/lib/format";

export const metadata: Metadata = { title: "Nova OS" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function NovaOsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; vehicleId?: string }>;
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
      currentKm: v.currentKm,
    }));

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/ordens-servico"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h2 className="text-xl md:text-2xl font-bold">Nova ordem de serviço</h2>
        <p className="text-sm text-muted-foreground">
          A KM atual é obrigatória e atualiza o veículo automaticamente
        </p>
      </div>
      <OsCreateForm
        clients={clients}
        vehicles={vehicles}
        mechanics={mechanics}
        defaultClientId={params.clientId}
        defaultVehicleId={params.vehicleId}
      />
    </div>
  );
}
