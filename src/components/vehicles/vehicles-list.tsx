"use client";

import Link from "next/link";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { VehicleWithClient } from "@/lib/data/types";
import { formatKm, formatPlate } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { deleteVehicleAction } from "@/lib/actions/vehicles";
import { cn } from "@/lib/utils";

export function VehiclesList({ items }: { items: VehicleWithClient[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, plate: string) {
    if (!confirm(`Remover o veículo ${formatPlate(plate)}?`)) return;
    setDeletingId(id);
    try {
      const res = await deleteVehicleAction(id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Veículo removido");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum veículo encontrado"
        description="Cadastre um veículo vinculado a um cliente."
        actionHref="/veiculos/novo"
        actionLabel="Novo veículo"
      />
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {items.map((v) => (
          <Card key={v.id} className="rounded-xl shadow-sm">
            <CardContent className="p-0">
              <Link href={`/veiculos/${v.id}`} className="block p-4">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-bold tracking-wide">
                      {formatPlate(v.plate)}
                    </p>
                    <p className="text-sm">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {v.client.name} · {formatKm(v.currentKm)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Placa</th>
              <th className="px-4 py-3 font-medium">Veículo</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">KM</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/veiculos/${v.id}`}
                    className="font-bold tracking-wide text-primary hover:underline"
                  >
                    {formatPlate(v.plate)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {v.brand} {v.model}
                  <p className="text-xs text-muted-foreground">
                    {v.yearModel} · {v.color}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/clientes/${v.clientId}`}
                    className="hover:underline"
                  >
                    {v.client.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatKm(v.currentKm)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/veiculos/${v.id}/editar`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "rounded-lg"
                      )}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-destructive"
                      disabled={deletingId === v.id}
                      onClick={() => handleDelete(v.id, v.plate)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
