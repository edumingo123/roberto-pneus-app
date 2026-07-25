import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listAppointments, listMechanicOptions } from "@/lib/data/appointments";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";
import { AppointmentsSidebar } from "@/components/appointments/appointments-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Agendamentos" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{
    mechanicId?: string;
    status?: string;
    selected?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await resolveSession();
  const tenantId = session.user.tenantId;

  const [appointments, mechanics] = await Promise.all([
    listAppointments({
      tenantId,
      mechanicId: params.mechanicId,
      status: (params.status as "TODOS") || "TODOS",
    }),
    listMechanicOptions(tenantId),
  ]);

  const canApprove =
    session.user.role === "ADMIN" || session.user.role === "RECEPCIONISTA";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agendamentos"
        description="Calendário com prevenção de conflito por mecânico"
      >
        <Link
          href="/agendamentos/novo"
          className={cn(
            buttonVariants(),
            "h-10 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold"
          )}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo agendamento
        </Link>
      </PageHeader>

      <Suspense fallback={<Skeleton className="h-11 w-full rounded-xl" />}>
        <SearchFilters
          placeholder="Use os filtros ao lado do calendário..."
          statusParam="status"
          statusOptions={[
            { value: "TODOS", label: "Todos status" },
            { value: "AGUARDANDO_APROVACAO", label: "Aguardando aprovação" },
            { value: "CONFIRMADO", label: "Confirmado" },
            { value: "EM_ANDAMENTO", label: "Em andamento" },
            { value: "CONCLUIDO", label: "Concluído" },
            { value: "CANCELADO", label: "Cancelado" },
          ]}
        />
      </Suspense>

      {/* Mechanic filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/agendamentos"
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium border",
            !params.mechanicId
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-muted"
          )}
        >
          Todos mecânicos
        </Link>
        {mechanics.map((m) => (
          <Link
            key={m.id}
            href={`/agendamentos?mechanicId=${m.id}${params.status ? `&status=${params.status}` : ""}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium border",
              params.mechanicId === m.id
                ? "bg-brand-orange text-white border-brand-orange"
                : "bg-card hover:bg-muted"
            )}
          >
            {m.name}
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AppointmentsCalendar appointments={appointments} />
        </div>
        <AppointmentsSidebar
          appointments={appointments}
          selectedId={params.selected}
          canApprove={canApprove}
        />
      </div>
    </div>
  );
}
