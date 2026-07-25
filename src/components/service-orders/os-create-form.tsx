"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, selectClassName } from "@/components/shared/form-field";
import {
  createServiceOrderDefaults,
  createServiceOrderSchema,
  type CreateServiceOrderFormValues,
} from "@/lib/validations/service-order";
import { createServiceOrderAction } from "@/lib/actions/service-orders";

interface Props {
  clients: { id: string; name: string }[];
  vehicles: {
    id: string;
    clientId: string;
    plate: string;
    label: string;
    currentKm: number;
  }[];
  mechanics: { id: string; name: string }[];
  defaultClientId?: string;
  defaultVehicleId?: string;
}

export function OsCreateForm({
  clients,
  vehicles,
  mechanics,
  defaultClientId,
  defaultVehicleId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateServiceOrderFormValues>({
    resolver: zodResolver(createServiceOrderSchema),
    defaultValues: {
      ...createServiceOrderDefaults,
      clientId: defaultClientId || "",
      vehicleId: defaultVehicleId || "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = form;

  const clientId = useWatch({ control, name: "clientId" });
  const vehicleId = useWatch({ control, name: "vehicleId" });

  const clientVehicles = useMemo(
    () => vehicles.filter((v) => v.clientId === clientId),
    [vehicles, clientId]
  );

  useEffect(() => {
    if (!defaultVehicleId) setValue("vehicleId", "");
  }, [clientId, defaultVehicleId, setValue]);

  useEffect(() => {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v) setValue("kmAtEntry", String(v.currentKm));
  }, [vehicleId, vehicles, setValue]);

  async function onSubmit(values: CreateServiceOrderFormValues) {
    setLoading(true);
    try {
      const res = await createServiceOrderAction(values);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      router.push(`/ordens-servico/${res.data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label="Cliente"
            required
            error={errors.clientId?.message}
            className="md:col-span-2"
          >
            <select className={selectClassName} {...register("clientId")}>
              <option value="">Selecione</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Veículo"
            required
            error={errors.vehicleId?.message}
          >
            <select
              className={selectClassName}
              disabled={!clientId}
              {...register("vehicleId")}
            >
              <option value="">Selecione</option>
              {clientVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="KM atual (obrigatória)"
            required
            error={errors.kmAtEntry?.message}
            hint="Atualiza automaticamente o veículo"
          >
            <Input
              type="number"
              min={0}
              className="h-11 rounded-xl"
              {...register("kmAtEntry")}
            />
          </FormField>
          <FormField label="Mecânico" className="md:col-span-2">
            <select className={selectClassName} {...register("mechanicId")}>
              <option value="">Atribuir depois</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Problema relatado"
            className="md:col-span-2"
          >
            <Textarea className="rounded-xl min-h-20" {...register("complaint")} />
          </FormField>
          <FormField label="Diagnóstico inicial" className="md:col-span-2">
            <Textarea className="rounded-xl min-h-16" {...register("diagnosis")} />
          </FormField>
          <FormField label="Notas internas" className="md:col-span-2">
            <Textarea
              className="rounded-xl min-h-16"
              {...register("internalNotes")}
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
          className="h-12 rounded-xl bg-primary font-semibold min-w-40 text-base"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Abrir OS"
          )}
        </Button>
      </div>
    </form>
  );
}
