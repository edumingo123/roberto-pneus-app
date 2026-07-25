import { z } from "zod";
import { isValidWhatsApp } from "./document";

export const userFormSchema = z
  .object({
    name: z.string().min(3, "Informe o nome").max(120),
    email: z.string().email("E-mail inválido"),
    phone: z
      .string()
      .refine((v) => !v || isValidWhatsApp(v), "Telefone inválido (use DDD)"),
    role: z.enum(["ADMIN", "MECANICO", "RECEPCIONISTA"]),
    specialty: z.string(),
    isActive: z.enum(["true", "false"]),
    password: z.string(),
    generatePassword: z.boolean(),
    avatarUrl: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "MECANICO" && !data.specialty.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Informe a especialidade do mecânico",
        path: ["specialty"],
      });
    }
  });

export type UserFormValues = z.infer<typeof userFormSchema>;

export function toUserInput(values: UserFormValues) {
  return {
    name: values.name,
    email: values.email,
    phone: values.phone || null,
    role: values.role,
    specialty: values.specialty || null,
    isActive: values.isActive === "true",
    password: values.password || null,
    generatePassword: values.generatePassword,
    avatarUrl: values.avatarUrl || null,
  };
}

export const userDefaultValues: UserFormValues = {
  name: "",
  email: "",
  phone: "",
  role: "RECEPCIONISTA",
  specialty: "",
  isActive: "true",
  password: "",
  generatePassword: true,
  avatarUrl: "",
};

export function generateTempPassword(length = 10): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
