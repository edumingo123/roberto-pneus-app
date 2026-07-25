import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listTemplates } from "@/lib/data/templates";
import { TemplatesManager } from "@/components/settings/templates-manager";

export const metadata: Metadata = { title: "Templates WhatsApp" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function TemplatesPage() {
  const session = await resolveSession();
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "RECEPCIONISTA"
  ) {
    redirect("/dashboard");
  }

  const templates = await listTemplates(session.user.tenantId);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Configurações
        </Link>
        <h2 className="text-xl md:text-2xl font-bold">
          Mensagens automáticas
        </h2>
        <p className="text-sm text-muted-foreground">
          Templates WhatsApp com variáveis e preview ao vivo
        </p>
      </div>
      <TemplatesManager initial={templates} />
    </div>
  );
}
