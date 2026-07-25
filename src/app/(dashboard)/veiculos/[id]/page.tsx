import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { getVehicleById } from "@/lib/data/vehicles";
import { VehicleDetailView } from "@/components/vehicles/vehicle-detail";

export const metadata: Metadata = { title: "Detalhe do veículo" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function VeiculoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSession();
  const vehicle = await getVehicleById(session.user.tenantId, id);
  if (!vehicle) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/veiculos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Veículos
      </Link>
      <VehicleDetailView vehicle={vehicle} />
    </div>
  );
}
