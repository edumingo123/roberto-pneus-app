"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TireRecord } from "@/lib/data/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTireAction, updateTireAction } from "@/lib/actions/tires";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: TireRecord | null;
  /** Called with the saved tire for immediate list update */
  onSaved?: (tire: TireRecord) => void;
}

type FormValues = {
  brand: string;
  model: string;
  size: string;
  type: string;
  price: string;
  promoPrice: string;
  isPromo: boolean;
  stockQty: string;
  minStock: string;
  loadIndex: string;
  speedRating: string;
  season: string;
  sku: string;
  description: string;
  imageUrl: string;
  compatibleMakes: string;
  compatibleModels: string;
};

export function TireFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    values: {
      brand: initial?.brand ?? "Michelin",
      model: initial?.model ?? "",
      size: initial?.size ?? "",
      type: initial?.type ?? "PASSEIO",
      price: initial ? String(initial.price) : "",
      promoPrice: initial?.promoPrice != null ? String(initial.promoPrice) : "",
      isPromo: initial?.isPromo ?? false,
      stockQty: initial ? String(initial.stockQty) : "0",
      minStock: initial ? String(initial.minStock) : "2",
      loadIndex: initial?.loadIndex ?? "",
      speedRating: initial?.speedRating ?? "",
      season: initial?.season ?? "",
      sku: initial?.sku ?? "",
      description: initial?.description ?? "",
      imageUrl: initial?.imageUrl ?? "",
      compatibleMakes: initial?.compatibleMakes.join(", ") ?? "",
      compatibleModels: initial?.compatibleModels.join(", ") ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const payload = { ...values, isActive: true };
      const res = initial
        ? await updateTireAction(initial.id, payload)
        : await createTireAction(payload);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      onOpenChange(false);
      onSaved?.(res.data);
    } finally {
      setLoading(false);
    }
  }

  const { register, handleSubmit } = form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar pneu" : "Novo pneu"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Marca">
              <Input className="h-10 rounded-xl" {...register("brand")} required />
            </Field>
            <Field label="Modelo">
              <Input className="h-10 rounded-xl" {...register("model")} required />
            </Field>
            <Field label="Medida">
              <Input
                className="h-10 rounded-xl"
                placeholder="205/55R16"
                {...register("size")}
                required
              />
            </Field>
            <Field label="Tipo">
              <select
                className="h-10 w-full rounded-xl border px-3 text-sm"
                {...register("type")}
              >
                {[
                  "PASSEIO",
                  "SUV",
                  "CAMINHONETE",
                  "COMERCIAL",
                  "MOTO",
                  "OFF_ROAD",
                  "CORRIDA",
                  "OUTRO",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preço">
              <Input
                type="number"
                step="0.01"
                className="h-10 rounded-xl"
                {...register("price")}
                required
              />
            </Field>
            <Field label="Preço promo">
              <Input
                type="number"
                step="0.01"
                className="h-10 rounded-xl"
                {...register("promoPrice")}
              />
            </Field>
            <Field label="Estoque">
              <Input
                type="number"
                className="h-10 rounded-xl"
                {...register("stockQty")}
                required
              />
            </Field>
            <Field label="Estoque mín.">
              <Input
                type="number"
                className="h-10 rounded-xl"
                {...register("minStock")}
              />
            </Field>
            <Field label="Carga">
              <Input className="h-10 rounded-xl" {...register("loadIndex")} />
            </Field>
            <Field label="Velocidade">
              <Input className="h-10 rounded-xl" {...register("speedRating")} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isPromo")} className="size-4" />
            Em promoção
          </label>
          <Field label="URL da foto">
            <Input className="h-10 rounded-xl" {...register("imageUrl")} />
          </Field>
          <Field label="Marcas compatíveis (vírgula)">
            <Input className="h-10 rounded-xl" {...register("compatibleMakes")} />
          </Field>
          <Field label="Modelos compatíveis (vírgula)">
            <Textarea
              className="rounded-xl min-h-16"
              placeholder="Honda Civic 2020, Toyota Corolla 2020"
              {...register("compatibleModels")}
            />
          </Field>
          <Field label="Descrição">
            <Textarea className="rounded-xl min-h-16" {...register("description")} />
          </Field>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : initial ? (
              "Salvar"
            ) : (
              "Cadastrar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
