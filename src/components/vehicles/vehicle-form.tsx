"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, selectClassName } from "@/components/shared/form-field";
import {
  vehicleDefaultValues,
  vehicleFormSchema,
  type VehicleFormValues,
} from "@/lib/validations/vehicle";
import { normalizePlate } from "@/lib/validations/plate";
import {
  FUEL_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "@/lib/constants/brazil";
import {
  createVehicleAction,
  updateVehicleAction,
} from "@/lib/actions/vehicles";
import type { VehicleRecord } from "@/lib/data/types";

interface VehicleFormProps {
  mode: "create" | "edit";
  initial?: VehicleRecord;
  clients: { id: string; name: string; document: string }[];
  defaultClientId?: string;
}

export function VehicleForm({
  mode,
  initial,
  clients,
  defaultClientId,
}: VehicleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: initial
      ? {
          clientId: initial.clientId,
          plate: initial.plate,
          brand: initial.brand,
          model: initial.model,
          yearManufacture: String(initial.yearManufacture),
          yearModel: String(initial.yearModel),
          color: initial.color,
          currentKm: String(initial.currentKm),
          chassis: initial.chassis ?? "",
          fuel: initial.fuel ?? "",
          transmission: initial.transmission ?? "",
          engine: initial.engine ?? "",
          power: initial.power ?? "",
          engineCode: initial.engineCode ?? "",
          notes: initial.notes ?? "",
        }
      : {
          ...vehicleDefaultValues,
          clientId: defaultClientId ?? "",
        },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  async function onSubmit(values: VehicleFormValues) {
    setLoading(true);
    try {
      if (mode === "create") {
        const res = await createVehicleAction(values);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success(res.message ?? "Veículo cadastrado");
        router.push(`/veiculos/${res.data.id}`);
        router.refresh();
      } else if (initial) {
        const res = await updateVehicleAction(initial.id, values);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success(res.message ?? "Veículo atualizado");
        router.push(`/veiculos/${initial.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Identificação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Cliente"
            htmlFor="clientId"
            required
            error={errors.clientId?.message}
            className="md:col-span-2"
          >
            <select
              id="clientId"
              className={selectClassName}
              {...register("clientId")}
            >
              <option value="">Selecione o cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Placa"
            htmlFor="plate"
            required
            error={errors.plate?.message}
            hint="Padrão antigo (ABC1234) ou Mercosul (ABC1D23)"
          >
            <Input
              id="plate"
              className="h-11 rounded-xl uppercase"
              maxLength={8}
              {...register("plate", {
                onChange: (e) =>
                  setValue("plate", normalizePlate(e.target.value), {
                    shouldValidate: true,
                  }),
              })}
            />
          </FormField>

          <FormField
            label="KM atual"
            htmlFor="currentKm"
            required
            error={errors.currentKm?.message}
            hint="Será atualizada automaticamente ao criar/finalizar OS"
          >
            <Input
              id="currentKm"
              type="number"
              min={0}
              className="h-11 rounded-xl"
              {...register("currentKm")}
            />
          </FormField>

          <FormField
            label="Marca"
            htmlFor="brand"
            required
            error={errors.brand?.message}
          >
            <Input id="brand" className="h-11 rounded-xl" {...register("brand")} />
          </FormField>

          <FormField
            label="Modelo"
            htmlFor="model"
            required
            error={errors.model?.message}
          >
            <Input id="model" className="h-11 rounded-xl" {...register("model")} />
          </FormField>

          <FormField
            label="Ano fabricação"
            htmlFor="yearManufacture"
            required
            error={errors.yearManufacture?.message}
          >
            <Input
              id="yearManufacture"
              type="number"
              className="h-11 rounded-xl"
              {...register("yearManufacture")}
            />
          </FormField>

          <FormField
            label="Ano modelo"
            htmlFor="yearModel"
            required
            error={errors.yearModel?.message}
          >
            <Input
              id="yearModel"
              type="number"
              className="h-11 rounded-xl"
              {...register("yearModel")}
            />
          </FormField>

          <FormField
            label="Cor"
            htmlFor="color"
            required
            error={errors.color?.message}
          >
            <Input id="color" className="h-11 rounded-xl" {...register("color")} />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Detalhes opcionais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Chassi" htmlFor="chassis">
            <Input
              id="chassis"
              className="h-11 rounded-xl uppercase"
              {...register("chassis")}
            />
          </FormField>
          <FormField label="Combustível" htmlFor="fuel">
            <select id="fuel" className={selectClassName} {...register("fuel")}>
              <option value="">—</option>
              {FUEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Câmbio" htmlFor="transmission">
            <select
              id="transmission"
              className={selectClassName}
              {...register("transmission")}
            >
              <option value="">—</option>
              {TRANSMISSION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Motorização" htmlFor="engine">
            <Input
              id="engine"
              className="h-11 rounded-xl"
              placeholder="ex: 1.0 Turbo"
              {...register("engine")}
            />
          </FormField>
          <FormField label="Potência" htmlFor="power">
            <Input
              id="power"
              className="h-11 rounded-xl"
              placeholder="ex: 120 cv"
              {...register("power")}
            />
          </FormField>
          <FormField label="Código do motor" htmlFor="engineCode">
            <Input
              id="engineCode"
              className="h-11 rounded-xl"
              {...register("engineCode")}
            />
          </FormField>
          <FormField label="Observações" htmlFor="notes" className="md:col-span-2">
            <Textarea
              id="notes"
              className="min-h-20 rounded-xl"
              {...register("notes")}
            />
          </FormField>
        </div>
      </section>

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-primary font-semibold min-w-36"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "create" ? (
            "Cadastrar veículo"
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </div>
    </form>
  );
}
