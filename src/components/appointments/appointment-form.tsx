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
  appointmentDefaultValues,
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/lib/validations/appointment";
import { createAppointmentAction } from "@/lib/actions/appointments";
import { cn } from "@/lib/utils";

interface Slot {
  hour: number;
  minute: number;
  free: boolean;
}

interface Props {
  clients: { id: string; name: string }[];
  vehicles: { id: string; clientId: string; plate: string; label: string }[];
  mechanics: { id: string; name: string; specialty: string | null }[];
  slots: Slot[];
  defaultDate?: string;
  defaultStartTime?: string;
  defaultClientId?: string;
}

export function AppointmentForm({
  clients,
  vehicles,
  mechanics,
  slots: initialSlots,
  defaultDate,
  defaultStartTime,
  defaultClientId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState(initialSlots);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      ...appointmentDefaultValues,
      date: defaultDate || appointmentDefaultValues.date,
      startTime: defaultStartTime || appointmentDefaultValues.startTime,
      clientId: defaultClientId || "",
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
  const mechanicId = useWatch({ control, name: "mechanicId" });
  const date = useWatch({ control, name: "date" });
  const startTime = useWatch({ control, name: "startTime" });

  const clientVehicles = useMemo(
    () => vehicles.filter((v) => v.clientId === clientId),
    [vehicles, clientId]
  );

  useEffect(() => {
    setValue("vehicleId", "");
  }, [clientId, setValue]);

  // Auto end time +30min
  useEffect(() => {
    if (!startTime) return;
    const [h, m] = startTime.split(":").map(Number);
    const end = new Date(2000, 0, 1, h, m + 60);
    setValue(
      "endTime",
      `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
    );
  }, [startTime, setValue]);

  // Refresh slots when mechanic/date change — client uses initial server slots for selected day; full refresh via URL is heavy so recompute from prop pattern: parent re-fetches on navigation. For demo we accept initialSlots and update when date/mech change by local heuristic.
  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots, mechanicId, date]);

  async function onSubmit(values: AppointmentFormValues) {
    setLoading(true);
    try {
      const res = await createAppointmentAction(values);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Agendamento criado");
      router.push("/agendamentos");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Cliente e serviço
        </h3>
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
          <FormField label="Veículo" error={errors.vehicleId?.message}>
            <select
              className={selectClassName}
              disabled={!clientId}
              {...register("vehicleId")}
            >
              <option value="">Opcional</option>
              {clientVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Serviço solicitado"
            required
            error={errors.title?.message}
            className="md:col-span-2"
          >
            <Input className="h-11 rounded-xl" {...register("title")} />
          </FormField>
          <FormField label="Descrição" className="md:col-span-2">
            <Textarea className="rounded-xl min-h-20" {...register("description")} />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Data, horário e mecânico
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <FormField label="Data" required error={errors.date?.message}>
            <Input type="date" className="h-11 rounded-xl" {...register("date")} />
          </FormField>
          <FormField label="Início" required error={errors.startTime?.message}>
            <Input
              type="time"
              className="h-11 rounded-xl"
              step={1800}
              {...register("startTime")}
            />
          </FormField>
          <FormField label="Término" required error={errors.endTime?.message}>
            <Input
              type="time"
              className="h-11 rounded-xl"
              step={1800}
              {...register("endTime")}
            />
          </FormField>
          <FormField
            label="Mecânico"
            className="md:col-span-3"
            error={errors.mechanicId?.message}
          >
            <select className={selectClassName} {...register("mechanicId")}>
              <option value="">Sem mecânico</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.specialty ? ` — ${m.specialty}` : ""}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {mechanicId ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Disponibilidade do dia (slots de 30 min)
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {slots.map((s) => {
                const label = `${String(s.hour).padStart(2, "0")}:${String(s.minute).padStart(2, "0")}`;
                const selected = startTime === label;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!s.free}
                    onClick={() => setValue("startTime", label)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                      !s.free &&
                        "bg-muted text-muted-foreground opacity-50 cursor-not-allowed line-through",
                      s.free &&
                        !selected &&
                        "bg-success/10 text-success border-success/30 hover:bg-success/20",
                      selected &&
                        "bg-brand-orange text-white border-brand-orange"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Verde = livre · Cinza = ocupado
            </p>
          </div>
        ) : null}

        <FormField label="Observações">
          <Textarea className="rounded-xl min-h-16" {...register("notes")} />
        </FormField>
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
          className="h-11 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold min-w-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Salvar agendamento"
          )}
        </Button>
      </div>
    </form>
  );
}
