import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listServiceOrders } from "@/lib/data/service-orders";
import { listMechanicOptions } from "@/lib/data/appointments";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { OsList } from "@/components/service-orders/os-list";
import { Skeleton } from "@/components/ui/skeleton";
import { OS_STATUS_ORDER, osStatusLabel } from "@/lib/service-orders/status";
import { cn } from "@/lib/utils";
import type { ServiceOrderStatus } from "@/lib/data/types";

export const metadata: Metadata = { title: "Ordens de Serviço" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function OrdensServicoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    mechanicId?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await resolveSession();
  const result = await listServiceOrders({
    tenantId: session.user.tenantId,
    q: params.q,
    status: (params.status as ServiceOrderStatus | "TODOS") || "TODOS",
    mechanicId: params.mechanicId,
    page: params.page,
  });
  const mechanics = await listMechanicOptions(session.user.tenantId);

  function chipHref(status?: string) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.mechanicId) sp.set("mechanicId", params.mechanicId);
    if (status && status !== "TODOS") sp.set("status", status);
    const qs = sp.toString();
    return qs ? `/ordens-servico?${qs}` : "/ordens-servico";
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ordens de Serviço"
        description="Core da oficina — KM, orçamento, fotos e acompanhamento"
        actionHref="/ordens-servico/nova"
        actionLabel="Nova OS"
      />

      <Suspense fallback={<Skeleton className="h-11 w-full rounded-xl" />}>
        <SearchFilters placeholder="Buscar por nº da OS, placa ou cliente..." />
      </Suspense>

      <div className="flex flex-wrap gap-2">
        <Link
          href={chipHref("TODOS")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold border",
            !params.status || params.status === "TODOS"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-muted"
          )}
        >
          Todas
        </Link>
        {OS_STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={chipHref(s)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold border",
              params.status === s
                ? "bg-brand-orange text-white border-brand-orange"
                : "bg-card hover:bg-muted"
            )}
          >
            {osStatusLabel(s)}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/ordens-servico${params.status ? `?status=${params.status}` : ""}`}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] border",
            !params.mechanicId ? "bg-muted font-medium" : "bg-card"
          )}
        >
          Todos mecânicos
        </Link>
        {mechanics.map((m) => (
          <Link
            key={m.id}
            href={`/ordens-servico?mechanicId=${m.id}${params.status ? `&status=${params.status}` : ""}${params.q ? `&q=${params.q}` : ""}`}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] border",
              params.mechanicId === m.id
                ? "bg-primary text-primary-foreground"
                : "bg-card"
            )}
          >
            {m.name}
          </Link>
        ))}
      </div>

      <OsList items={result.items} />

      <PaginationControls
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath="/ordens-servico"
        searchParams={{
          q: params.q,
          status: params.status,
          mechanicId: params.mechanicId,
        }}
      />
    </div>
  );
}
