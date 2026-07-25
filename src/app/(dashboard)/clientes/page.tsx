import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listClients } from "@/lib/data/clients";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ClientsList } from "@/components/clients/clients-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Clientes" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await resolveSession();
  const result = await listClients({
    tenantId: session.user.tenantId,
    q: params.q,
    status: (params.status as "ATIVO" | "INATIVO" | "TODOS") || "TODOS",
    page: params.page,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description="Cadastro e histórico de clientes da oficina"
        actionHref="/clientes/novo"
        actionLabel="Novo cliente"
      />

      <Suspense fallback={<Skeleton className="h-11 w-full rounded-xl" />}>
        <SearchFilters
          placeholder="Buscar por nome, telefone, e-mail ou CPF/CNPJ..."
          statusOptions={[
            { value: "TODOS", label: "Todos" },
            { value: "ATIVO", label: "Ativos" },
            { value: "INATIVO", label: "Inativos" },
          ]}
        />
      </Suspense>

      <ClientsList items={result.items} />

      <PaginationControls
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath="/clientes"
        searchParams={{ q: params.q, status: params.status }}
      />
    </div>
  );
}
