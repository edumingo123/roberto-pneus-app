import type { Metadata } from "next";
import { AgentPlayground } from "@/components/ia/agent-playground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Agente de IA" };

export default function AgenteIaPage() {
  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Agente de IA</h2>
        <p className="text-sm text-muted-foreground">
          WhatsApp com Function Calling · GPT-4o-mini quando{" "}
          <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code> estiver
          configurada
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <AgentPlayground />
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ferramentas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["buscar_pneus", "Catálogo por medida/marca/carro"],
              ["verificar_compatibilidade", "Pneu × veículo"],
              ["consultar_estoque", "Quantidade disponível"],
              ["criar_agendamento", "Status Aguardando Aprovação"],
              ["consultar_status_os", "Por placa ou número"],
              ["informacoes_oficina", "Horário e pagamentos"],
            ].map(([name, desc]) => (
              <div key={name} className="flex items-start gap-2">
                <Badge variant="secondary" className="rounded-lg font-mono text-[10px] shrink-0">
                  {name}
                </Badge>
                <span className="text-muted-foreground text-xs pt-0.5">
                  {desc}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
              <p>
                Webhook:{" "}
                <code className="bg-muted px-1 rounded">
                  POST /api/webhooks/whatsapp
                </code>
              </p>
              <p>
                Playground API:{" "}
                <code className="bg-muted px-1 rounded">
                  POST /api/agent/chat
                </code>
              </p>
              <p className="pt-1">
                Exemplos: “pneu 205/55R16 Civic”, “status OS placa ABC1D23”,
                “agendar alinhamento amanhã”
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
