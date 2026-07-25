import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listClientOptions } from "@/lib/data/vehicles";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export const metadata: Metadata = { title: "Novo veículo" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function NovoVeiculoPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const session = await resolveSession();
  const clients = await listClientOptions(session.user.tenantId);

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link
          href="/veiculos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h2 className="text-xl md:text-2xl font-bold">Novo veículo</h2>
        <p className="text-sm text-muted-foreground">
          O veículo deve estar vinculado a um cliente
        </p>
      </div>
      <VehicleForm
        mode="create"
        clients={clients}
        defaultClientId={params.clientId}
      />
    </div>
  );
}
