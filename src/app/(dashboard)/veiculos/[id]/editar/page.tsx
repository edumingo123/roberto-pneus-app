import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { getVehicleById, listClientOptions } from "@/lib/data/vehicles";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export const metadata: Metadata = { title: "Editar veículo" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function EditarVeiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSession();
  const [vehicle, clients] = await Promise.all([
    getVehicleById(session.user.tenantId, id),
    listClientOptions(session.user.tenantId),
  ]);
  if (!vehicle) notFound();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link
          href={`/veiculos/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h2 className="text-xl md:text-2xl font-bold">Editar veículo</h2>
      </div>
      <VehicleForm mode="edit" initial={vehicle} clients={clients} />
    </div>
  );
}
