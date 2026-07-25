import { z } from "zod";
import { isValidPlate, normalizePlate } from "./plate";

const year = new Date().getFullYear();

export const vehicleFormSchema = z.object({
  clientId: z.string().min(1, "Selecione o cliente"),
  plate: z
    .string()
    .min(7, "Informe a placa")
    .refine((v) => isValidPlate(v), "Placa inválida (padrão antigo ou Mercosul)"),
  brand: z.string().min(1, "Informe a marca"),
  model: z.string().min(1, "Informe o modelo"),
  yearManufacture: z
    .string()
    .min(1, "Informe o ano")
    .refine((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 1950 && n <= year + 1;
    }, "Ano inválido"),
  yearModel: z
    .string()
    .min(1, "Informe o ano")
    .refine((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 1950 && n <= year + 2;
    }, "Ano inválido"),
  color: z.string().min(1, "Informe a cor"),
  currentKm: z
    .string()
    .min(1, "Informe a KM")
    .refine((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 0 && n <= 9_999_999;
    }, "KM inválida"),
  chassis: z.string(),
  fuel: z.enum([
    "",
    "GASOLINA",
    "ETANOL",
    "FLEX",
    "DIESEL",
    "GNV",
    "ELETRICO",
    "HIBRIDO",
    "OUTRO",
  ]),
  transmission: z.enum([
    "",
    "MANUAL",
    "AUTOMATICO",
    "CVT",
    "AUTOMATIZADO",
    "OUTRO",
  ]),
  engine: z.string(),
  power: z.string(),
  engineCode: z.string(),
  notes: z.string(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export function toVehicleInput(values: VehicleFormValues) {
  return {
    clientId: values.clientId,
    plate: values.plate,
    brand: values.brand,
    model: values.model,
    yearManufacture: Number(values.yearManufacture),
    yearModel: Number(values.yearModel),
    color: values.color,
    currentKm: Number(values.currentKm),
    chassis: values.chassis || null,
    fuel: values.fuel || null,
    transmission: values.transmission || null,
    engine: values.engine || null,
    power: values.power || null,
    engineCode: values.engineCode || null,
    notes: values.notes || null,
  };
}

export const vehicleDefaultValues: VehicleFormValues = {
  clientId: "",
  plate: "",
  brand: "",
  model: "",
  yearManufacture: String(year),
  yearModel: String(year),
  color: "",
  currentKm: "0",
  chassis: "",
  fuel: "",
  transmission: "",
  engine: "",
  power: "",
  engineCode: "",
  notes: "",
};

export const vehicleKmSchema = z.object({
  vehicleId: z.string().min(1),
  km: z.number().int().min(0).max(9_999_999),
});

export function sanitizePlate(plate: string): string {
  return normalizePlate(plate);
}
