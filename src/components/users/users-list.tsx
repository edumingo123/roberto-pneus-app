"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { UserRecord } from "@/lib/data/types";
import { ROLE_LABELS } from "@/types";
import { formatWhatsApp } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { deleteUserAction } from "@/lib/actions/users";
import { cn } from "@/lib/utils";

export function UsersList({
  items,
  currentUserId,
}: {
  items: UserRecord[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(u: UserRecord) {
    if (u.id === currentUserId) {
      toast.error("Você não pode desativar a si mesmo");
      return;
    }
    if (!confirm(`Desativar o usuário "${u.name}"?`)) return;
    setDeletingId(u.id);
    try {
      const res = await deleteUserAction(u.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Usuário desativado");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum usuário"
        description="Cadastre colaboradores da oficina."
        actionHref="/usuarios/novo"
        actionLabel="Novo usuário"
      />
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {items.map((u) => {
          const initials = u.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <Card key={u.id} className="rounded-xl shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {u.avatarUrl ? (
                      <AvatarImage src={u.avatarUrl} alt={u.name} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                  <StatusBadge active={u.isActive} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="rounded-lg">
                    {ROLE_LABELS[u.role]}
                  </Badge>
                  {u.specialty ? (
                    <Badge variant="outline" className="rounded-lg">
                      {u.specialty}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/usuarios/${u.id}/editar`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-lg flex-1"
                    )}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-destructive"
                    disabled={deletingId === u.id || u.id === currentUserId}
                    onClick={() => handleDelete(u)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              const initials = u.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <tr key={u.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {u.avatarUrl ? (
                          <AvatarImage src={u.avatarUrl} alt={u.name} />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p>{ROLE_LABELS[u.role]}</p>
                    {u.specialty ? (
                      <p className="text-xs text-muted-foreground">
                        {u.specialty}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {u.phone ? formatWhatsApp(u.phone) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={u.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/usuarios/${u.id}/editar`}
                        className={cn(
                          buttonVariants({
                            variant: "ghost",
                            size: "icon-sm",
                          }),
                          "rounded-lg"
                        )}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-destructive"
                        disabled={
                          deletingId === u.id || u.id === currentUserId
                        }
                        onClick={() => handleDelete(u)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
