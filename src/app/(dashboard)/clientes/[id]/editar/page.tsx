import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { getClientById } from "@/lib/data/clients";
import { ClientForm } from "@/components/clients/client-form";

export const metadata: Metadata = { title: "Editar cliente" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSession();
  const client = await getClientById(session.user.tenantId, id);
  if (!client) notFound();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link
          href={`/clientes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h2 className="text-xl md:text-2xl font-bold">Editar cliente</h2>
        <p className="text-sm text-muted-foreground">{client.name}</p>
      </div>
      <ClientForm mode="edit" initial={client} />
    </div>
  );
}
