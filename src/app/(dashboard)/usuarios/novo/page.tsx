import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { UserForm } from "@/components/users/user-form";

export const metadata: Metadata = { title: "Novo usuário" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function NovoUsuarioPage() {
  const session = await resolveSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/usuarios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h2 className="text-xl md:text-2xl font-bold">Novo usuário</h2>
        <p className="text-sm text-muted-foreground">
          Defina o perfil e a senha de acesso do colaborador
        </p>
      </div>
      <UserForm mode="create" />
    </div>
  );
}
