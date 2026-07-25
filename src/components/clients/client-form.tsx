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
import {
  FormField,
  selectClassName,
} from "@/components/shared/form-field";
import {
  clientDefaultValues,
  clientFormSchema,
  type ClientFormValues,
} from "@/lib/validations/client";
import {
  formatCep,
  formatCpfCnpj,
  formatWhatsApp,
} from "@/lib/validations/document";
import { BRAZIL_STATES, GENDER_OPTIONS } from "@/lib/constants/brazil";
import {
  createClientAction,
  updateClientAction,
} from "@/lib/actions/clients";
import type { ClientRecord } from "@/lib/data/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClientFormProps {
  mode: "create" | "edit";
  initial?: ClientRecord;
}

export function ClientForm({ mode, initial }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vehiclePrompt, setVehiclePrompt] = useState<{
    clientId: string;
    name: string;
  } | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          document: formatCpfCnpj(initial.document),
          whatsapp: formatWhatsApp(initial.whatsapp),
          email: initial.email ?? "",
          birthDate: initial.birthDate ?? "",
          gender: initial.gender,
          addressStreet: initial.addressStreet,
          addressNumber: initial.addressNumber,
          addressComplement: initial.addressComplement ?? "",
          addressDistrict: initial.addressDistrict,
          addressCity: initial.addressCity,
          addressZip: formatCep(initial.addressZip),
          addressState: initial.addressState,
          notes: initial.notes ?? "",
          status: initial.status,
        }
      : clientDefaultValues,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  async function onSubmit(values: ClientFormValues) {
    setLoading(true);
    try {
      if (mode === "create") {
        const res = await createClientAction(values);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success(res.message ?? "Cliente cadastrado");
        setVehiclePrompt({ clientId: res.data.id, name: res.data.name });
      } else if (initial) {
        const res = await updateClientAction(initial.id, values);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success(res.message ?? "Cliente atualizado");
        router.push(`/clientes/${initial.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Dados pessoais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nome completo"
              htmlFor="name"
              required
              error={errors.name?.message}
              className="md:col-span-2"
            >
              <Input id="name" className="h-11 rounded-xl" {...register("name")} />
            </FormField>

            <FormField
              label="CPF ou CNPJ"
              htmlFor="document"
              required
              error={errors.document?.message}
            >
              <Input
                id="document"
                className="h-11 rounded-xl"
                {...register("document", {
                  onChange: (e) =>
                    setValue("document", formatCpfCnpj(e.target.value), {
                      shouldValidate: true,
                    }),
                })}
              />
            </FormField>

            <FormField
              label="WhatsApp (com DDD)"
              htmlFor="whatsapp"
              required
              error={errors.whatsapp?.message}
            >
              <Input
                id="whatsapp"
                className="h-11 rounded-xl"
                placeholder="(11) 99999-9999"
                {...register("whatsapp", {
                  onChange: (e) =>
                    setValue("whatsapp", formatWhatsApp(e.target.value), {
                      shouldValidate: true,
                    }),
                })}
              />
            </FormField>

            <FormField
              label="E-mail"
              htmlFor="email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                className="h-11 rounded-xl"
                {...register("email")}
              />
            </FormField>

            <FormField
              label="Data de nascimento"
              htmlFor="birthDate"
              error={errors.birthDate?.message}
            >
              <Input
                id="birthDate"
                type="date"
                className="h-11 rounded-xl"
                {...register("birthDate")}
              />
            </FormField>

            <FormField
              label="Sexo"
              htmlFor="gender"
              error={errors.gender?.message}
            >
              <select
                id="gender"
                className={selectClassName}
                {...register("gender")}
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Status"
              htmlFor="status"
              error={errors.status?.message}
            >
              <select
                id="status"
                className={selectClassName}
                {...register("status")}
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </FormField>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Endereço
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <FormField
              label="CEP"
              htmlFor="addressZip"
              required
              error={errors.addressZip?.message}
              className="md:col-span-2"
            >
              <Input
                id="addressZip"
                className="h-11 rounded-xl"
                {...register("addressZip", {
                  onChange: (e) =>
                    setValue("addressZip", formatCep(e.target.value), {
                      shouldValidate: true,
                    }),
                })}
              />
            </FormField>
            <FormField
              label="Rua"
              htmlFor="addressStreet"
              required
              error={errors.addressStreet?.message}
              className="md:col-span-4"
            >
              <Input
                id="addressStreet"
                className="h-11 rounded-xl"
                {...register("addressStreet")}
              />
            </FormField>
            <FormField
              label="Número"
              htmlFor="addressNumber"
              required
              error={errors.addressNumber?.message}
              className="md:col-span-2"
            >
              <Input
                id="addressNumber"
                className="h-11 rounded-xl"
                {...register("addressNumber")}
              />
            </FormField>
            <FormField
              label="Complemento"
              htmlFor="addressComplement"
              className="md:col-span-4"
            >
              <Input
                id="addressComplement"
                className="h-11 rounded-xl"
                {...register("addressComplement")}
              />
            </FormField>
            <FormField
              label="Bairro"
              htmlFor="addressDistrict"
              required
              error={errors.addressDistrict?.message}
              className="md:col-span-3"
            >
              <Input
                id="addressDistrict"
                className="h-11 rounded-xl"
                {...register("addressDistrict")}
              />
            </FormField>
            <FormField
              label="Cidade"
              htmlFor="addressCity"
              required
              error={errors.addressCity?.message}
              className="md:col-span-2"
            >
              <Input
                id="addressCity"
                className="h-11 rounded-xl"
                {...register("addressCity")}
              />
            </FormField>
            <FormField
              label="Estado"
              htmlFor="addressState"
              required
              error={errors.addressState?.message}
              className="md:col-span-1"
            >
              <select
                id="addressState"
                className={selectClassName}
                {...register("addressState")}
              >
                {BRAZIL_STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.value}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
          <FormField label="Observações" htmlFor="notes">
            <Textarea
              id="notes"
              className="min-h-24 rounded-xl"
              {...register("notes")}
            />
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
            className="h-11 rounded-xl bg-primary hover:bg-primary/90 font-semibold min-w-36"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "create" ? (
              "Cadastrar cliente"
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </div>
      </form>

      <Dialog
        open={!!vehiclePrompt}
        onOpenChange={(open) => {
          if (!open && vehiclePrompt) {
            router.push(`/clientes/${vehiclePrompt.clientId}`);
            router.refresh();
            setVehiclePrompt(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cliente cadastrado!</DialogTitle>
            <DialogDescription>
              Deseja cadastrar um veículo para{" "}
              <strong>{vehiclePrompt?.name}</strong> agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Link
              href={
                vehiclePrompt
                  ? `/clientes/${vehiclePrompt.clientId}`
                  : "/clientes"
              }
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 rounded-xl"
              )}
              onClick={() => setVehiclePrompt(null)}
            >
              Agora não
            </Link>
            <Link
              href={
                vehiclePrompt
                  ? `/veiculos/novo?clientId=${vehiclePrompt.clientId}`
                  : "/veiculos/novo"
              }
              className={cn(
                buttonVariants(),
                "h-10 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white"
              )}
              onClick={() => setVehiclePrompt(null)}
            >
              Adicionar veículo
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
