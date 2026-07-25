import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listVehicles } from "@/lib/data/vehicles";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { VehiclesList } from "@/components/vehicles/vehicles-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Veículos" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; clientId?: string }>;
}) {
  const params = await searchParams;
  const session = await resolveSession();
  const result = await listVehicles({
    tenantId: session.user.tenantId,
    q: params.q,
    page: params.page,
    clientId: params.clientId,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Veículos"
        description="Sempre vinculados a um cliente · KM obrigatória na OS"
        actionHref="/veiculos/novo"
        actionLabel="Novo veículo"
      />

      <Suspense fallback={<Skeleton className="h-11 w-full rounded-xl" />}>
        <SearchFilters placeholder="Buscar por placa, marca, modelo ou cliente..." />
      </Suspense>

      <VehiclesList items={result.items} />

      <PaginationControls
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath="/veiculos"
        searchParams={{ q: params.q, clientId: params.clientId }}
      />
    </div>
  );
}
