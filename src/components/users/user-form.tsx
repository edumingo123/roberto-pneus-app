"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, selectClassName } from "@/components/shared/form-field";
import {
  userDefaultValues,
  userFormSchema,
  type UserFormValues,
} from "@/lib/validations/user";
import { formatWhatsApp } from "@/lib/validations/document";
import { ROLE_OPTIONS } from "@/lib/constants/brazil";
import { createUserAction, updateUserAction } from "@/lib/actions/users";
import type { UserRecord } from "@/lib/data/types";

interface UserFormProps {
  mode: "create" | "edit";
  initial?: UserRecord;
}

export function UserForm({ mode, initial }: UserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          email: initial.email,
          phone: initial.phone ? formatWhatsApp(initial.phone) : "",
          role: initial.role,
          specialty: initial.specialty ?? "",
          isActive: initial.isActive ? "true" : "false",
          password: "",
          generatePassword: true,
          avatarUrl: initial.avatarUrl ?? "",
        }
      : userDefaultValues,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = form;

  const role = useWatch({ control, name: "role" });
  const generatePassword = useWatch({ control, name: "generatePassword" });

  async function onSubmit(values: UserFormValues) {
    setLoading(true);
    try {
      if (mode === "create") {
        const res = await createUserAction(values);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success("Usuário criado");
        if (res.data.temporaryPassword) {
          setCreatedPassword(res.data.temporaryPassword);
        } else {
          router.push("/usuarios");
          router.refresh();
        }
      } else if (initial) {
        const res = await updateUserAction(initial.id, values);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        toast.success(res.message ?? "Usuário atualizado");
        router.push("/usuarios");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (createdPassword) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4 max-w-lg">
        <h3 className="font-semibold text-lg">Usuário criado com sucesso</h3>
        <p className="text-sm text-muted-foreground">
          Guarde a senha temporária e compartilhe com o colaborador. Ela não
          será exibida novamente.
        </p>
        <div className="rounded-xl bg-muted p-4 font-mono text-center text-lg tracking-wider">
          {createdPassword}
        </div>
        <Button
          className="w-full h-11 rounded-xl"
          onClick={() => {
            router.push("/usuarios");
            router.refresh();
          }}
        >
          Ir para lista de usuários
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Nome"
            htmlFor="name"
            required
            error={errors.name?.message}
            className="md:col-span-2"
          >
            <Input id="name" className="h-11 rounded-xl" {...register("name")} />
          </FormField>

          <FormField
            label="E-mail"
            htmlFor="email"
            required
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
            label="Telefone"
            htmlFor="phone"
            error={errors.phone?.message}
          >
            <Input
              id="phone"
              className="h-11 rounded-xl"
              {...register("phone", {
                onChange: (e) =>
                  setValue("phone", formatWhatsApp(e.target.value), {
                    shouldValidate: true,
                  }),
              })}
            />
          </FormField>

          <FormField
            label="Perfil (role)"
            htmlFor="role"
            required
            error={errors.role?.message}
          >
            <select id="role" className={selectClassName} {...register("role")}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>

          {role === "MECANICO" ? (
            <FormField
              label="Especialidade"
              htmlFor="specialty"
              required
              error={errors.specialty?.message}
            >
              <Input
                id="specialty"
                className="h-11 rounded-xl"
                placeholder="ex: Freios, suspensão, pneus"
                {...register("specialty")}
              />
            </FormField>
          ) : null}

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

          <FormField
            label="URL da foto"
            htmlFor="avatarUrl"
            className="md:col-span-2"
            hint="Opcional — URL pública da imagem"
          >
            <Input
              id="avatarUrl"
              className="h-11 rounded-xl"
              placeholder="https://..."
              {...register("avatarUrl")}
            />
          </FormField>
        </div>
      </section>

      {mode === "create" ? (
        <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Senha de acesso
          </h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              checked={!!generatePassword}
              onChange={(e) => setValue("generatePassword", e.target.checked)}
            />
            Gerar senha temporária automaticamente
          </label>
          {!generatePassword ? (
            <FormField
              label="Definir senha"
              htmlFor="password"
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                className="h-11 rounded-xl"
                {...register("password")}
              />
            </FormField>
          ) : null}
        </section>
      ) : null}

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
          className="h-11 rounded-xl bg-primary font-semibold min-w-36"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "create" ? (
            "Criar usuário"
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </form>
  );
}
