import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";
import { UserForm } from "@/components/users/user-form";

export const metadata: Metadata = { title: "Editar usuário" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const user = await getUserById(session.user.tenantId, id);
  if (!user) notFound();

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
        <h2 className="text-xl md:text-2xl font-bold">Editar usuário</h2>
        <p className="text-sm text-muted-foreground">{user.name}</p>
      </div>
      <UserForm mode="edit" initial={user} />
    </div>
  );
}
