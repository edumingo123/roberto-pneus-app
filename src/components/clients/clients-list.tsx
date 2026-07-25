"use client";

import Link from "next/link";
import { Car, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { ClientWithVehicles } from "@/lib/data/types";
import { formatCpfCnpj, formatWhatsApp } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteClientAction } from "@/lib/actions/clients";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface ClientsListProps {
  items: ClientWithVehicles[];
}

export function ClientsList({ items }: ClientsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o cliente "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await deleteClientAction(id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Cliente excluído");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum cliente encontrado"
        description="Cadastre o primeiro cliente da oficina ou ajuste a busca."
        actionHref="/clientes/novo"
        actionLabel="Novo cliente"
      />
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {items.map((c) => (
          <Card key={c.id} className="rounded-xl shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Link
                href={`/clientes/${c.id}`}
                className="block p-4 active:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatWhatsApp(c.whatsapp)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCpfCnpj(c.document)}
                    </p>
                  </div>
                  <StatusBadge active={c.status === "ATIVO"} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    {c._count?.vehicles ?? c.vehicles.length} veículo(s)
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Veículos</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr
                key={c.id}
                className="border-t border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                  {c.email ? (
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {formatCpfCnpj(c.document)}
                </td>
                <td className="px-4 py-3">{formatWhatsApp(c.whatsapp)}</td>
                <td className="px-4 py-3">
                  {c._count?.vehicles ?? c.vehicles.length}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge active={c.status === "ATIVO"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/clientes/${c.id}/editar`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "rounded-lg"
                      )}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-destructive"
                      title="Excluir"
                      disabled={deletingId === c.id}
                      onClick={() => handleDelete(c.id, c.name)}
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
