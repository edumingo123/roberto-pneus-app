import type { Metadata } from "next";
import {
  Users,
  Wrench,
  Clock,
  CalendarDays,
} from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { MechanicDashboard } from "@/components/dashboard/mechanic-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDemoStore } from "@/lib/data/demo-store";
import { listServiceOrders } from "@/lib/data/service-orders";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function DashboardPage() {
  const session = await resolveSession();
  const { user, tenant } = session;
  const store = getDemoStore();
  const tenantId = user.tenantId;

  const clients = store.clients.filter(
    (c) => c.tenantId === tenantId && c.status === "ATIVO"
  ).length;
  const openOs = store.serviceOrders.filter(
    (o) =>
      o.tenantId === tenantId &&
      o.status !== "ENTREGUE" &&
      o.status !== "CANCELADO"
  ).length;
  const pendingApprovals =
    store.appointments.filter(
      (a) =>
        a.tenantId === tenantId && a.status === "AGUARDANDO_APROVACAO"
    ).length +
    store.serviceOrders.filter(
      (o) => o.tenantId === tenantId && o.status === "ORCAMENTO"
    ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const appointmentsToday = store.appointments.filter((a) => {
    if (a.tenantId !== tenantId) return false;
    const s = new Date(a.startsAt).getTime();
    return s >= today.getTime() && s < tomorrow.getTime();
  }).length;

  if (user.role === "MECANICO") {
    const orders = await listServiceOrders({
      tenantId,
      mechanicId: user.id,
      page: 1,
    });
    // also show unassigned + all open if mechanic id matches demo
    const all = await listServiceOrders({ tenantId, page: 1 });
    const mine = all.items.filter(
      (o) => !o.mechanicId || o.mechanicId === user.id
    );
    return (
      <MechanicDashboard
        userName={user.name}
        orders={mine.length ? mine : orders.items}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Olá, {user.name.split(" ")[0]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {tenant.name} · resumo do dia
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit rounded-lg border-brand-orange/40 text-brand-orange"
        >
          {isDemoMode() ? "Modo demo" : "Produção"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Clientes ativos"
          value={clients}
          description="Cadastros"
          icon={Users}
          accent="primary"
        />
        <StatCard
          title="OS abertas"
          value={openOs}
          description="Em andamento"
          icon={Wrench}
          accent="orange"
        />
        <StatCard
          title="Aprovações"
          value={pendingApprovals}
          description="Pendentes"
          icon={Clock}
          accent="warning"
        />
        <StatCard
          title="Agendamentos"
          value={appointmentsToday}
          description="Hoje"
          icon={CalendarDays}
          accent="success"
        />
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Atalhos rápidos
        </h3>
        <QuickActions role={user.role} />
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Status do sistema</CardTitle>
            <CardDescription>Fases implementadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Step done label="Fundação + multi-tenant" />
            <Step done label="Cadastros (clientes, veículos, usuários)" />
            <Step done label="Core (agenda, OS, PDF, tracking)" />
            <Step done label="Comunicação (chat, WhatsApp, templates)" />
            <Step done label="Pneus + Agente IA" />
            <Step done label="Polish + PWA" />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sessão atual</CardTitle>
            <CardDescription>Contexto multi-tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Usuário" value={user.name} />
            <Row label="E-mail" value={user.email} />
            <Row label="Perfil" value={user.role} />
            <Row label="Tenant ID" value={user.tenantId} mono />
            <Row label="Oficina" value={tenant.name} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Step({ done, label }: { done?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          done
            ? "h-2 w-2 rounded-full bg-success shrink-0"
            : "h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0"
        }
      />
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          mono ? "font-mono text-xs truncate" : "font-medium truncate"
        }
      >
        {value}
      </span>
    </div>
  );
}
