import { z } from "zod";

export const maintenanceTypeFormSchema = z
  .object({
    name: z.string().min(2, "Informe o nome").max(100),
    description: z.string(),
    defaultKm: z.string(),
    defaultDays: z.string(),
    isActive: z.enum(["true", "false"]),
  })
  .superRefine((data, ctx) => {
    const km = data.defaultKm === "" ? null : Number(data.defaultKm);
    const days = data.defaultDays === "" ? null : Number(data.defaultDays);

    if (data.defaultKm !== "" && (!Number.isInteger(km) || (km ?? 0) < 1)) {
      ctx.addIssue({
        code: "custom",
        message: "KM inválido",
        path: ["defaultKm"],
      });
    }
    if (
      data.defaultDays !== "" &&
      (!Number.isInteger(days) || (days ?? 0) < 1)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Dias inválidos",
        path: ["defaultDays"],
      });
    }
    if (data.defaultKm === "" && data.defaultDays === "") {
      ctx.addIssue({
        code: "custom",
        message: "Informe intervalo em KM e/ou em dias",
        path: ["defaultKm"],
      });
    }
  });

export type MaintenanceTypeFormValues = z.infer<
  typeof maintenanceTypeFormSchema
>;

export function toMaintenanceTypeInput(values: MaintenanceTypeFormValues) {
  return {
    name: values.name,
    description: values.description || null,
    defaultKm: values.defaultKm === "" ? null : Number(values.defaultKm),
    defaultDays:
      values.defaultDays === "" ? null : Number(values.defaultDays),
    isActive: values.isActive === "true",
  };
}

export const maintenanceTypeDefaultValues: MaintenanceTypeFormValues = {
  name: "",
  description: "",
  defaultKm: "",
  defaultDays: "",
  isActive: "true",
};
