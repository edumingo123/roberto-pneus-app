import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { createWhatsAppService } from "@/lib/whatsapp/service";
import { createWhatsAppProvider } from "@/lib/whatsapp/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Integração WhatsApp" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function WhatsappConfigPage() {
  const session = await resolveSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const provider = createWhatsAppProvider();
  const service = createWhatsAppService(session.user.tenantId);
  const logs = service.listLogs(20);
  const configured = provider.isConfigured();
  const demo = isDemoMode();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Configurações
        </Link>
        <h2 className="text-xl md:text-2xl font-bold">Integração WhatsApp</h2>
        <p className="text-sm text-muted-foreground">
          Evolution API · camada de abstração WhatsAppService
        </p>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Modo:</span>
            <Badge variant="secondary" className="rounded-lg">
              {demo ? "DEMO (envio simulado)" : "Produção"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Evolution API:</span>
            <Badge
              className={
                configured
                  ? "rounded-lg bg-success/15 text-success border-0"
                  : "rounded-lg bg-warning/15 text-warning border-0"
              }
            >
              {configured ? "Configurada" : "Não configurada"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Variáveis: <code className="bg-muted px-1 rounded">EVOLUTION_API_URL</code>,{" "}
            <code className="bg-muted px-1 rounded">EVOLUTION_API_KEY</code>,{" "}
            <code className="bg-muted px-1 rounded">EVOLUTION_INSTANCE</code>
          </p>
          <p className="text-xs text-muted-foreground">
            Webhook: <code className="bg-muted px-1 rounded">/api/webhooks/whatsapp</code>
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Logs recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum envio ainda. Teste um template ou mude o status de uma OS.
            </p>
          ) : (
            logs.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border p-3 text-sm space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{l.toPhone}</span>
                  <Badge variant="secondary" className="rounded-lg text-[10px]">
                    {l.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {l.templateKey ?? "raw"} ·{" "}
                  {new Date(l.createdAt).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs line-clamp-2">{l.body}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
