"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X, ExternalLink, Bot } from "lucide-react";
import { toast } from "sonner";
import type { AppointmentDetail } from "@/lib/data/types";
import { APPOINTMENT_STATUS_LABELS } from "@/types";
import { APPOINTMENT_STATUS_COLORS } from "@/lib/service-orders/status";
import { formatPlate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setAppointmentStatusAction } from "@/lib/actions/appointments";

export function AppointmentsSidebar({
  appointments,
  selectedId,
  canApprove,
}: {
  appointments: AppointmentDetail[];
  selectedId?: string;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pending = appointments.filter(
    (a) => a.status === "AGUARDANDO_APROVACAO"
  );
  const selected =
    appointments.find((a) => a.id === selectedId) || pending[0] || null;

  async function handleStatus(
    id: string,
    status: "CONFIRMADO" | "CANCELADO"
  ) {
    setLoadingId(id);
    try {
      const res = await setAppointmentStatusAction(id, status);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 ? (
        <Card className="rounded-xl border-warning/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-warning" />
              Aguardando aprovação ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border p-3 space-y-2 bg-warning/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{a.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.title}
                      {a.vehicle ? ` · ${formatPlate(a.vehicle.plate)}` : ""}
                    </p>
                    <p className="text-xs mt-1">
                      {new Date(a.startsAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  {a.createdByAi ? (
                    <Badge variant="secondary" className="rounded-lg text-[10px]">
                      IA
                    </Badge>
                  ) : null}
                </div>
                {canApprove ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="rounded-lg h-9 bg-success hover:bg-success/90 text-white"
                      disabled={loadingId === a.id}
                      onClick={() => handleStatus(a.id, "CONFIRMADO")}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 text-destructive border-destructive/40"
                      disabled={loadingId === a.id}
                      onClick={() => handleStatus(a.id, "CANCELADO")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Recusar
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Apenas Admin/Recepcionista pode aprovar
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {selected && selected.status !== "AGUARDANDO_APROVACAO" ? (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalhe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{selected.client.name}</p>
            <p className="text-muted-foreground">{selected.title}</p>
            <p>
              {selected.vehicle
                ? formatPlate(selected.vehicle.plate)
                : "Sem veículo"}
            </p>
            <p>
              {new Date(selected.startsAt).toLocaleString("pt-BR")} —{" "}
              {new Date(selected.endsAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>Mecânico: {selected.mechanic?.name ?? "—"}</p>
            <Badge
              className="rounded-lg border-0 text-white"
              style={{
                background:
                  APPOINTMENT_STATUS_COLORS[selected.status] ?? "#64748B",
              }}
            >
              {APPOINTMENT_STATUS_LABELS[selected.status]}
            </Badge>
            {selected.publicToken ? (
              <Link
                href={`/acompanhamento/agendamento/${selected.publicToken}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Link público
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Próximos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {appointments
            .filter(
              (a) =>
                a.status === "CONFIRMADO" || a.status === "EM_ANDAMENTO"
            )
            .slice(0, 5)
            .map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  router.push(`/agendamentos?selected=${a.id}`)
                }
                className="w-full text-left rounded-lg border p-2 hover:bg-muted/40 transition-colors"
              >
                <p className="text-sm font-medium truncate">
                  {a.client.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.startsAt).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  {a.vehicle ? ` · ${formatPlate(a.vehicle.plate)}` : ""}
                </p>
              </button>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
