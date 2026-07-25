import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listUsers } from "@/lib/data/users";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { UsersList } from "@/components/users/users-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Usuários" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await resolveSession();

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const result = await listUsers({
    tenantId: session.user.tenantId,
    q: params.q,
    role: (params.role as "ADMIN" | "MECANICO" | "RECEPCIONISTA" | "TODOS") ||
      "TODOS",
    page: params.page,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuários"
        description="Colaboradores da oficina · apenas Admin"
        actionHref="/usuarios/novo"
        actionLabel="Novo usuário"
      />

      <Suspense fallback={<Skeleton className="h-11 w-full rounded-xl" />}>
        <SearchFilters
          placeholder="Buscar por nome, e-mail ou especialidade..."
          statusParam="role"
          statusOptions={[
            { value: "TODOS", label: "Todos os perfis" },
            { value: "ADMIN", label: "Administradores" },
            { value: "MECANICO", label: "Mecânicos" },
            { value: "RECEPCIONISTA", label: "Recepcionistas" },
          ]}
        />
      </Suspense>

      <UsersList
        items={result.items}
        currentUserId={session.user.id}
      />

      <PaginationControls
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath="/usuarios"
        searchParams={{ q: params.q, role: params.role }}
      />
    </div>
  );
}
