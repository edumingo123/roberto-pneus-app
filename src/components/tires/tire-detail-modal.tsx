"use client";

import { useState } from "react";
import {
  Loader2,
  Minus,
  Pencil,
  Plus,
  ShoppingCart,
  FileText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { TireRecord } from "@/lib/data/types";
import { effectivePrice } from "@/lib/data/tires";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  adjustStockAction,
  tireInterestAction,
} from "@/lib/actions/tires";
import { cn } from "@/lib/utils";

interface Props {
  tire: TireRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  onUpdated?: (tire: TireRecord) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TireDetailModal({
  tire,
  open,
  onOpenChange,
  canManage,
  onUpdated,
  onEdit,
  onDelete,
}: Props) {
  const [qty, setQty] = useState(4);
  const [imgIdx, setImgIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  if (!tire) return null;

  const images =
    tire.imageUrls?.length > 0
      ? tire.imageUrls
      : tire.imageUrl
        ? [tire.imageUrl]
        : [];
  const price = effectivePrice(tire);
  const total = price * qty;

  async function interest(type: "ORCAMENTO" | "COMPRA") {
    setLoading(true);
    try {
      const res = await tireInterestAction({
        tireId: tire!.id,
        quantity: qty,
        type,
        clientName: clientName || undefined,
        clientPhone: clientPhone || undefined,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  async function stock(delta: number) {
    setLoading(true);
    try {
      const res = await adjustStockAction(tire!.id, delta);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      onUpdated?.(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-left">
            {tire.brand} {tire.model}
          </DialogTitle>
          <p className="text-sm font-mono text-primary">{tire.size}</p>
        </DialogHeader>

        <div className="px-4">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
            {images[imgIdx] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[imgIdx]}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "h-14 w-14 rounded-lg overflow-hidden border-2 shrink-0",
                    i === imgIdx ? "border-brand-orange" : "border-transparent"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-4 space-y-4 text-sm">
          <div className="flex flex-wrap gap-1.5">
            {tire.isPromo ? (
              <Badge className="rounded-lg bg-brand-orange text-white border-0">
                Promoção
              </Badge>
            ) : null}
            <Badge variant="secondary" className="rounded-lg">
              {tire.type}
            </Badge>
            {tire.season ? (
              <Badge variant="outline" className="rounded-lg">
                {tire.season}
              </Badge>
            ) : null}
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase">Preço un.</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                R${" "}
                {price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              {tire.isPromo && tire.promoPrice != null ? (
                <span className="text-sm text-muted-foreground line-through">
                  R${" "}
                  {tire.price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Spec label="Índice carga" value={tire.loadIndex ?? "—"} />
            <Spec label="Índice vel." value={tire.speedRating ?? "—"} />
            <Spec label="SKU" value={tire.sku ?? "—"} />
            <Spec
              label="Estoque"
              value={`${tire.stockQty} un.`}
              highlight={tire.stockQty <= tire.minStock}
            />
          </div>

          {tire.description ? (
            <p className="text-muted-foreground">{tire.description}</p>
          ) : null}

          <div>
            <p className="font-medium mb-1.5">Carros compatíveis</p>
            <div className="flex flex-wrap gap-1">
              {tire.compatibleModels.length === 0 ? (
                <span className="text-muted-foreground text-xs">
                  Consulte a ficha técnica
                </span>
              ) : (
                tire.compatibleModels.map((m) => (
                  <Badge
                    key={m}
                    variant="secondary"
                    className="rounded-lg font-normal"
                  >
                    {m}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Quantidade</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="h-10 w-10 rounded-xl border flex items-center justify-center hover:bg-muted"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-bold w-8 text-center">{qty}</span>
              <button
                type="button"
                className="h-10 w-10 rounded-xl border flex items-center justify-center hover:bg-muted"
                onClick={() => setQty((q) => Math.min(20, q + 1))}
              >
                <Plus className="h-4 w-4" />
              </button>
              <p className="ml-auto font-semibold">
                Total R${" "}
                {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Nome (opcional)"
              className="h-10 rounded-xl"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <Input
              placeholder="WhatsApp (opcional)"
              className="h-10 rounded-xl"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl font-semibold"
              disabled={loading}
              onClick={() => void interest("ORCAMENTO")}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-1.5" />
                  Solicitar orçamento
                </>
              )}
            </Button>
            <Button
              type="button"
              className="h-12 rounded-xl font-semibold bg-brand-orange hover:bg-brand-orange/90 text-white"
              disabled={loading || tire.stockQty < 1}
              onClick={() => void interest("COMPRA")}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  Comprar agora
                </>
              )}
            </Button>
          </div>

          {canManage ? (
            <div className="border-t pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => onEdit?.()}
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => onDelete?.()}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Excluir
                </Button>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Ajuste de estoque
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={loading}
                    onClick={() => void stock(-1)}
                  >
                    −1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={loading}
                    onClick={() => void stock(1)}
                  >
                    +1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={loading}
                    onClick={() => void stock(4)}
                  >
                    +4
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Spec({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className={cn("font-medium", highlight && "text-warning")}>{value}</p>
    </div>
  );
}
