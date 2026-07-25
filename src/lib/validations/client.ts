import { z } from "zod";
import { isValidCpfOrCnpj, isValidWhatsApp, onlyDigits } from "./document";

export const clientFormSchema = z.object({
  name: z
    .string()
    .min(3, "Informe o nome completo")
    .max(120, "Nome muito longo"),
  document: z
    .string()
    .min(11, "Informe CPF ou CNPJ")
    .refine((v) => isValidCpfOrCnpj(v), "CPF ou CNPJ inválido"),
  whatsapp: z
    .string()
    .min(10, "Informe o WhatsApp com DDD")
    .refine((v) => isValidWhatsApp(v), "WhatsApp inválido (use DDD)"),
  email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.enum(["MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMADO"]),
  addressStreet: z.string().min(1, "Informe a rua"),
  addressNumber: z.string().min(1, "Informe o número"),
  addressComplement: z.string().optional().or(z.literal("")),
  addressDistrict: z.string().min(1, "Informe o bairro"),
  addressCity: z.string().min(1, "Informe a cidade"),
  addressZip: z
    .string()
    .min(8, "CEP inválido")
    .refine((v) => onlyDigits(v).length === 8, "CEP deve ter 8 dígitos"),
  addressState: z.string().length(2, "Selecione o estado"),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["ATIVO", "INATIVO"]),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export const clientDefaultValues: ClientFormValues = {
  name: "",
  document: "",
  whatsapp: "",
  email: "",
  birthDate: "",
  gender: "NAO_INFORMADO",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressDistrict: "",
  addressCity: "",
  addressZip: "",
  addressState: "SP",
  notes: "",
  status: "ATIVO",
};
