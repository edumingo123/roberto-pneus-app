"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MaintenanceTypeRecord } from "@/lib/data/types";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaintenanceTypeForm } from "./maintenance-type-form";
import { deleteMaintenanceTypeAction } from "@/lib/actions/maintenance-types";

export function MaintenanceTypesManager({
  items,
}: {
  items: MaintenanceTypeRecord[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceTypeRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(item: MaintenanceTypeRecord) {
    if (
      !confirm(
        item.isSystem
          ? `Desativar o tipo padrão "${item.name}"?`
          : `Remover/desativar "${item.name}"?`
      )
    ) {
      return;
    }
    setDeletingId(item.id);
    try {
      const res = await deleteMaintenanceTypeAction(item.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Removido");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="h-10 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo tipo
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum tipo de manutenção"
          description="Crie tipos como Troca de Óleo, Correia Dentada, etc."
        />
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {items.map((t) => (
              <Card key={t.id} className="rounded-xl shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      {t.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {t.description}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge active={t.isActive} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.defaultKm ? (
                      <Badge variant="secondary" className="rounded-lg">
                        {t.defaultKm.toLocaleString("pt-BR")} km
                      </Badge>
                    ) : null}
                    {t.defaultDays ? (
                      <Badge variant="secondary" className="rounded-lg">
                        {t.defaultDays} dias
                      </Badge>
                    ) : null}
                    {t.isSystem ? (
                      <Badge variant="outline" className="rounded-lg">
                        Padrão
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg flex-1"
                      onClick={() => {
                        setEditing(t);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-destructive"
                      disabled={deletingId === t.id}
                      onClick={() => handleDelete(t)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Intervalo KM</th>
                  <th className="px-4 py-3 font-medium">Intervalo dias</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.name}</p>
                      {t.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {t.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {t.defaultKm
                        ? t.defaultKm.toLocaleString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{t.defaultDays ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={t.isActive} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg"
                          onClick={() => {
                            setEditing(t);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg text-destructive"
                          disabled={deletingId === t.id}
                          onClick={() => handleDelete(t)}
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
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar tipo" : "Novo tipo de manutenção"}
            </DialogTitle>
          </DialogHeader>
          <MaintenanceTypeForm
            mode={editing ? "edit" : "create"}
            initial={editing ?? undefined}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
