import Link from "next/link";
import {
  Car,
  MapPin,
  Pencil,
  Phone,
  Mail,
  CalendarClock,
  History,
  Plus,
} from "lucide-react";
import type { ClientDetail } from "@/lib/data/types";
import {
  formatCep,
  formatCpfCnpj,
  formatDateBR,
  formatKm,
  formatPlate,
  formatWhatsApp,
} from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";

export function ClientDetailView({ client }: { client: ClientDetail }) {
  const upcoming = client.vehicles.flatMap((v) =>
    v.maintenancePlans
      .filter((p) => p.isActive)
      .map((p) => ({
        ...p,
        plate: v.plate,
        vehicleLabel: `${v.brand} ${v.model}`,
      }))
  );

  const history = upcoming
    .filter((p) => p.lastServiceAt || p.lastServiceKm != null)
    .sort((a, b) => {
      const da = a.lastServiceAt ? new Date(a.lastServiceAt).getTime() : 0;
      const db = b.lastServiceAt ? new Date(b.lastServiceAt).getTime() : 0;
      return db - da;
    });

  const next = [...upcoming].sort((a, b) => {
    const da = a.nextDueAt ? new Date(a.nextDueAt).getTime() : Infinity;
    const db = b.nextDueAt ? new Date(b.nextDueAt).getTime() : Infinity;
    return da - db;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl md:text-2xl font-bold">{client.name}</h2>
            <StatusBadge active={client.status === "ATIVO"} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {formatCpfCnpj(client.document)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/clientes/${client.id}/editar`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 rounded-xl"
            )}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            Editar
          </Link>
          <Link
            href={`/veiculos/novo?clientId=${client.id}`}
            className={cn(
              buttonVariants(),
              "h-10 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white"
            )}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Veículo
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-orange" />
              {formatWhatsApp(client.whatsapp)}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {client.email || "—"}
            </p>
            <p className="text-muted-foreground">
              Nascimento: {formatDateBR(client.birthDate)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              {client.addressStreet}, {client.addressNumber}
              {client.addressComplement
                ? ` — ${client.addressComplement}`
                : ""}
            </p>
            <p>
              {client.addressDistrict} · {client.addressCity}/
              {client.addressState}
            </p>
            <p className="text-muted-foreground">
              CEP {formatCep(client.addressZip)}
            </p>
            {client.notes ? (
              <p className="pt-2 border-t text-muted-foreground">
                {client.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            Veículos vinculados
          </h3>
        </div>
        {client.vehicles.length === 0 ? (
          <EmptyState
            title="Nenhum veículo"
            description="Cadastre o primeiro veículo deste cliente."
            actionHref={`/veiculos/novo?clientId=${client.id}`}
            actionLabel="Adicionar veículo"
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {client.vehicles.map((v) => (
              <Link key={v.id} href={`/veiculos/${v.id}`}>
                <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold tracking-wide">
                          {formatPlate(v.plate)}
                        </p>
                        <p className="text-sm">
                          {v.brand} {v.model}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {v.yearModel} · {v.color} · {formatKm(v.currentKm)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-lg">
                        {v.maintenancePlans.length} plano(s)
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-brand-orange" />
              Próximas manutenções
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {next.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma manutenção planejada.
              </p>
            ) : (
              next.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{p.maintenanceType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPlate(p.plate)} · {p.vehicleLabel}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p>{formatDateBR(p.nextDueAt)}</p>
                    <p>
                      {p.nextDueKm != null ? formatKm(p.nextDueKm) : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Histórico simples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem serviços registrados nos planos.
              </p>
            ) : (
              history.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{p.maintenanceType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPlate(p.plate)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p>{formatDateBR(p.lastServiceAt)}</p>
                    <p>
                      {p.lastServiceKm != null
                        ? formatKm(p.lastServiceKm)
                        : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
