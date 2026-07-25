"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isDemoModeClient } from "@/lib/auth/demo-client";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;

function safeInternalPath(path: string | null): string {
  if (!path) return "/dashboard";
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  if (path.startsWith("/login")) return "/dashboard";
  return path;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeInternalPath(searchParams.get("redirect"));
  const errorCode = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Explain loop-breaking errors and ensure clean session
  useEffect(() => {
    if (errorCode === "no_profile") {
      toast.error(
        "Login no Auth ok, mas não há perfil de colaborador no banco. Peça ao admin para cadastrar seu e-mail em Usuários ou rode o seed."
      );
      // Clear leftover Supabase session to avoid bounce
      if (!isDemoModeClient()) {
        void createClient()
          .auth.signOut()
          .catch(() => undefined);
      }
    } else if (errorCode === "auth") {
      toast.error("Falha na autenticação. Tente entrar novamente.");
    }
  }, [errorCode]);

  async function onSubmit(values: LoginValues) {
    setLoading(true);
    try {
      if (isDemoModeClient()) {
        toast.success("Modo demo — entrando como Admin");
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message || "Falha no login");
        return;
      }

      toast.success("Bem-vindo!");
      // replace avoids back-button bouncing into login again
      router.replace(redirectTo);
      router.refresh();
    } catch {
      toast.error(
        "Não foi possível conectar. Verifique as variáveis do Supabase ou ative DEMO_MODE."
      );
    } finally {
      setLoading(false);
    }
  }

  function enterDemo() {
    toast.success("Entrando em modo demonstração");
    // Client-only demo still needs DEMO_MODE=true no servidor
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorCode === "no_profile" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Seu usuário existe no Supabase Auth, mas não está vinculado a um
          colaborador no banco (tabela <code>users</code>). Cadastre o mesmo
          e-mail em Usuários ou atualize <code>authUserId</code> após o seed.
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          className="h-11 rounded-xl"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-11 rounded-xl"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <LogIn className="h-4 w-4 mr-2" />
            Entrar
          </>
        )}
      </Button>

      {(isDemoModeClient() || process.env.NODE_ENV === "development") && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl border-dashed"
          onClick={enterDemo}
        >
          Continuar em modo demo
        </Button>
      )}

      <p className="text-center text-xs text-muted-foreground pt-1">
        Acesso restrito a colaboradores da oficina
      </p>
    </form>
  );
}
