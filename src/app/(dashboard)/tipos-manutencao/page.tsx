import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listMaintenanceTypes } from "@/lib/data/maintenance-types";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { MaintenanceTypesManager } from "@/components/maintenance-types/maintenance-types-manager";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Tipos de Manutenção" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function TiposManutencaoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await resolveSession();
  const result = await listMaintenanceTypes({
    tenantId: session.user.tenantId,
    q: params.q,
    page: params.page,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tipos de Manutenção"
        description="Configure intervalos em KM e/ou dias para lembretes"
      />

      <Suspense fallback={<Skeleton className="h-11 w-full rounded-xl" />}>
        <SearchFilters placeholder="Buscar tipo de manutenção..." />
      </Suspense>

      <MaintenanceTypesManager items={result.items} />

      <PaginationControls
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath="/tipos-manutencao"
        searchParams={{ q: params.q }}
      />
    </div>
  );
}
