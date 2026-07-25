"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ServiceOrderListItem } from "@/lib/data/types";
import { formatPlate } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { OsStatusBadge } from "./os-status-badge";

export function OsList({ items }: { items: ServiceOrderListItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhuma ordem de serviço"
        description="Abra a primeira OS da oficina."
        actionHref="/ordens-servico/nova"
        actionLabel="Nova OS"
      />
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {items.map((os) => (
          <Link key={os.id} href={`/ordens-servico/${os.id}`}>
            <Card className="rounded-xl shadow-sm active:scale-[0.99] transition-transform">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-lg">OS #{os.number}</p>
                    <p className="text-sm font-medium">{os.clientName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPlate(os.vehiclePlate)} · {os.vehicleLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {os.mechanicName ?? "Sem mecânico"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <OsStatusBadge status={os.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-primary mt-2">
                  R${" "}
                  {os.grandTotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">OS</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Veículo</th>
              <th className="px-4 py-3 font-medium">Mecânico</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((os) => (
              <tr key={os.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/ordens-servico/${os.id}`}
                    className="font-bold text-primary hover:underline"
                  >
                    #{os.number}
                  </Link>
                </td>
                <td className="px-4 py-3">{os.clientName}</td>
                <td className="px-4 py-3">
                  <p className="font-medium tracking-wide">
                    {formatPlate(os.vehiclePlate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {os.vehicleLabel}
                  </p>
                </td>
                <td className="px-4 py-3">{os.mechanicName ?? "—"}</td>
                <td className="px-4 py-3">
                  <OsStatusBadge status={os.status} />
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  R${" "}
                  {os.grandTotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
