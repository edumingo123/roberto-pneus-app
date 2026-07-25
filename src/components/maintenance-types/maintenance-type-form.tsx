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
  maintenanceTypeDefaultValues,
  maintenanceTypeFormSchema,
  type MaintenanceTypeFormValues,
} from "@/lib/validations/maintenance-type";
import {
  createMaintenanceTypeAction,
  updateMaintenanceTypeAction,
} from "@/lib/actions/maintenance-types";
import type { MaintenanceTypeRecord } from "@/lib/data/types";

interface Props {
  mode: "create" | "edit";
  initial?: MaintenanceTypeRecord;
  onSuccess?: () => void;
}

export function MaintenanceTypeForm({ mode, initial, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<MaintenanceTypeFormValues>({
    resolver: zodResolver(maintenanceTypeFormSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          defaultKm:
            initial.defaultKm != null ? String(initial.defaultKm) : "",
          defaultDays:
            initial.defaultDays != null ? String(initial.defaultDays) : "",
          isActive: initial.isActive ? "true" : "false",
        }
      : maintenanceTypeDefaultValues,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onSubmit(values: MaintenanceTypeFormValues) {
    setLoading(true);
    try {
      if (mode === "create") {
        const res = await createMaintenanceTypeAction(values);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success(res.message ?? "Tipo criado");
      } else if (initial) {
        const res = await updateMaintenanceTypeAction(initial.id, values);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success(res.message ?? "Tipo atualizado");
      }
      onSuccess?.();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Nome"
        htmlFor="name"
        required
        error={errors.name?.message}
      >
        <Input id="name" className="h-11 rounded-xl" {...register("name")} />
      </FormField>

      <FormField label="Descrição" htmlFor="description">
        <Textarea
          id="description"
          className="min-h-20 rounded-xl"
          {...register("description")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Intervalo (KM)"
          htmlFor="defaultKm"
          error={errors.defaultKm?.message}
          hint="Opcional"
        >
          <Input
            id="defaultKm"
            type="number"
            min={1}
            className="h-11 rounded-xl"
            {...register("defaultKm")}
          />
        </FormField>
        <FormField
          label="Intervalo (dias)"
          htmlFor="defaultDays"
          error={errors.defaultDays?.message}
          hint="Opcional"
        >
          <Input
            id="defaultDays"
            type="number"
            min={1}
            className="h-11 rounded-xl"
            {...register("defaultDays")}
          />
        </FormField>
      </div>

      <FormField label="Status" htmlFor="isActive">
        <select
          id="isActive"
          className={selectClassName}
          {...register("isActive")}
        >
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </FormField>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-primary font-semibold"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === "create" ? (
          "Criar tipo"
        ) : (
          "Salvar"
        )}
      </Button>
    </form>
  );
}
