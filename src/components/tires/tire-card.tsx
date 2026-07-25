"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TireRecord } from "@/lib/data/types";
import { effectivePrice } from "@/lib/data/tires";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  PASSEIO: "Passeio",
  SUV: "SUV",
  CAMINHONETE: "Caminhonete",
  CORRIDA: "Corrida",
  OFF_ROAD: "Off-road",
  COMERCIAL: "Carga",
  MOTO: "Moto",
  OUTRO: "Outro",
};

interface Props {
  tire: TireRecord;
  compatible?: boolean;
  canManage?: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TireCard({
  tire,
  compatible,
  canManage,
  onClick,
  onEdit,
  onDelete,
}: Props) {
  const price = effectivePrice(tire);
  const lowStock = tire.stockQty <= tire.minStock;

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card shadow-sm overflow-hidden",
        "hover:shadow-md hover:border-brand-orange/40 transition-all"
      )}
    >
      {/* Clickable body → details */}
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left active:scale-[0.99] transition-transform"
      >
        <div className="relative aspect-square bg-muted overflow-hidden">
          {tire.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tire.imageUrl}
              alt={`${tire.brand} ${tire.model}`}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
              Sem foto
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {tire.isPromo ? (
              <Badge className="rounded-lg bg-brand-orange text-white border-0 shadow">
                Promoção
              </Badge>
            ) : null}
            {compatible ? (
              <Badge className="rounded-lg bg-success text-white border-0 shadow">
                Compatível
              </Badge>
            ) : null}
          </div>
          {lowStock ? (
            <Badge className="absolute top-2 right-2 rounded-lg bg-warning text-warning-foreground border-0">
              Estoque baixo
            </Badge>
          ) : null}
        </div>
        <div className="p-3 space-y-1 pb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {tire.brand}
          </p>
          <p className="font-semibold leading-snug line-clamp-2">
            {tire.model}
          </p>
          <p className="text-sm font-mono text-primary">{tire.size}</p>
          <div className="flex items-end justify-between gap-2 pt-1">
            <div>
              {tire.isPromo && tire.promoPrice != null ? (
                <p className="text-xs text-muted-foreground line-through">
                  R${" "}
                  {tire.price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              ) : null}
              <p className="text-lg font-bold text-foreground">
                R${" "}
                {price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="rounded-lg text-[10px]">
                {TYPE_LABELS[tire.type] ?? tire.type}
              </Badge>
              <p
                className={cn(
                  "text-xs mt-1 font-medium",
                  tire.stockQty === 0
                    ? "text-destructive"
                    : lowStock
                      ? "text-warning"
                      : "text-success"
                )}
              >
                {tire.stockQty === 0
                  ? "Esgotado"
                  : `${tire.stockQty} un.`}
              </p>
            </div>
          </div>
        </div>
      </button>

      {/* Staff actions */}
      {canManage ? (
        <div className="flex border-t border-border">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 h-10",
              "text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            )}
            aria-label={`Editar ${tire.brand} ${tire.model}`}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          <div className="w-px bg-border" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 h-10",
              "text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
            )}
            aria-label={`Excluir ${tire.brand} ${tire.model}`}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      ) : null}
    </div>
  );
}
