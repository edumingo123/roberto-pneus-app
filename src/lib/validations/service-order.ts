import { z } from "zod";

export const createServiceOrderSchema = z.object({
  clientId: z.string().min(1, "Selecione o cliente"),
  vehicleId: z.string().min(1, "Selecione o veículo"),
  mechanicId: z.string().optional().or(z.literal("")),
  kmAtEntry: z
    .string()
    .min(1, "Informe a KM atual")
    .refine((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 0 && n <= 9_999_999;
    }, "KM inválida"),
  complaint: z.string(),
  diagnosis: z.string(),
  internalNotes: z.string(),
});

export type CreateServiceOrderFormValues = z.infer<
  typeof createServiceOrderSchema
>;

export const createServiceOrderDefaults: CreateServiceOrderFormValues = {
  clientId: "",
  vehicleId: "",
  mechanicId: "",
  kmAtEntry: "",
  complaint: "",
  diagnosis: "",
  internalNotes: "",
};

export const osInfoSchema = z.object({
  mechanicId: z.string().optional().or(z.literal("")),
  complaint: z.string(),
  diagnosis: z.string(),
  internalNotes: z.string(),
  discount: z.string(),
});

export type OsInfoFormValues = z.infer<typeof osInfoSchema>;

export const partRowSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Descrição"),
  brand: z.string(),
  quantity: z.string(),
  unitPrice: z.string(),
});

export const laborRowSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Descrição"),
  hours: z.string(),
  hourlyRate: z.string(),
});

export const statusTransitionSchema = z.object({
  toStatus: z.enum([
    "ORCAMENTO",
    "APROVADO",
    "EM_EXECUCAO",
    "QUALITY_CHECK",
    "PRONTO_RETIRADA",
    "ENTREGUE",
    "CANCELADO",
  ]),
  notes: z.string().optional(),
  kmAtExit: z.string().optional(),
});
