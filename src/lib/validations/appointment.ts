import { z } from "zod";

export const appointmentFormSchema = z
  .object({
    clientId: z.string().min(1, "Selecione o cliente"),
    vehicleId: z.string().optional().or(z.literal("")),
    mechanicId: z.string().optional().or(z.literal("")),
    title: z.string().min(3, "Informe o serviço solicitado"),
    description: z.string(),
    date: z.string().min(1, "Informe a data"),
    startTime: z.string().min(1, "Informe o horário"),
    endTime: z.string().min(1, "Informe o término"),
    notes: z.string(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(`${data.date}T${data.startTime}:00`);
    const end = new Date(`${data.date}T${data.endTime}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Data/hora inválida",
        path: ["date"],
      });
      return;
    }
    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        message: "Término deve ser após o início",
        path: ["endTime"],
      });
    }
  });

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export const appointmentDefaultValues: AppointmentFormValues = {
  clientId: "",
  vehicleId: "",
  mechanicId: "",
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endTime: "10:00",
  notes: "",
};

export function toAppointmentInput(values: AppointmentFormValues) {
  return {
    clientId: values.clientId,
    vehicleId: values.vehicleId || null,
    mechanicId: values.mechanicId || null,
    title: values.title,
    description: values.description || null,
    startsAt: new Date(`${values.date}T${values.startTime}:00`).toISOString(),
    endsAt: new Date(`${values.date}T${values.endTime}:00`).toISOString(),
    notes: values.notes || null,
  };
}
