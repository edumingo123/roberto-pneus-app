"use client";

import { useMemo, useState } from "react";
import { Eye, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import type { WhatsAppTemplateRecord } from "@/lib/data/types";
import {
  TEMPLATE_VARIABLES,
} from "@/lib/whatsapp/templates-catalog";
import { renderTemplate } from "@/lib/whatsapp/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  testTemplateSendAction,
  toggleTemplateAction,
  updateTemplateAction,
} from "@/lib/actions/templates";
import { cn } from "@/lib/utils";

const PREVIEW_VARS: Record<string, string> = {
  nome_cliente: "João da Silva",
  cliente_nome: "João da Silva",
  placa: "ABC1D23",
  veiculo: "Hyundai HB20",
  numero_os: "1042",
  os_numero: "1042",
  status: "Em execução",
  valor_total: "530,00",
  total: "530,00",
  previsao: "Hoje às 17h",
  link_os: "https://app.example/acompanhamento/demo",
  link_publico: "https://app.example/acompanhamento/demo",
  mecanico: "Carlos Mecânico",
  data: "25/07/2026",
  horario: "14:30",
  oficina_nome: "Roberto Pneus",
  data_hora: "25/07/2026 14:30",
};

export function TemplatesManager({
  initial,
}: {
  initial: WhatsAppTemplateRecord[];
}) {
  const [items, setItems] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const selected = useMemo(
    () => items.find((t) => t.id === selectedId) ?? null,
    [items, selectedId]
  );

  const [draftName, setDraftName] = useState(selected?.name ?? "");
  const [draftBody, setDraftBody] = useState(selected?.body ?? "");

  function select(t: WhatsAppTemplateRecord) {
    setSelectedId(t.id);
    setDraftName(t.name);
    setDraftBody(t.body);
  }

  const preview = useMemo(
    () => renderTemplate(draftBody || "", PREVIEW_VARS),
    [draftBody]
  );

  function insertVar(key: string) {
    setDraftBody((b) => `${b}{{${key}}}`);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await updateTemplateAction(selected.id, {
        name: draftName,
        body: draftBody,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setItems((list) =>
        list.map((t) => (t.id === selected.id ? res.data : t))
      );
      toast.success(res.message ?? "Salvo");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(t: WhatsAppTemplateRecord) {
    const res = await toggleTemplateAction(t.id, !t.isActive);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setItems((list) => list.map((x) => (x.id === t.id ? res.data : x)));
    if (selectedId === t.id) {
      // keep draft
    }
    toast.success(res.message);
  }

  async function testSend() {
    if (!selected) return;
    setTesting(true);
    try {
      // save first so test uses latest body
      await save();
      const res = await testTemplateSendAction(selected.key);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message, {
        description: res.data.body.slice(0, 120),
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      <Card className="rounded-xl lg:col-span-2 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Templates</CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
          {items.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t)}
              className={cn(
                "w-full text-left px-4 py-3 border-b hover:bg-muted/40 transition-colors",
                selectedId === t.id && "bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {t.key}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "rounded-lg shrink-0",
                    t.isActive
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.isActive ? "Ativo" : "Off"}
                </Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        {selected ? (
          <>
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Editor</CardTitle>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.isActive}
                    onChange={() => void toggle(selected)}
                    className="size-4 rounded"
                  />
                  Ativo
                </label>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Nome</label>
                  <Input
                    className="h-10 rounded-xl mt-1"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Corpo da mensagem
                  </label>
                  <Textarea
                    className="min-h-36 rounded-xl mt-1 font-mono text-sm"
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Inserir variável
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATE_VARIABLES.filter(
                      (v) =>
                        ![
                          "cliente_nome",
                          "os_numero",
                          "link_publico",
                          "total",
                          "oficina_nome",
                          "data_hora",
                        ].includes(v.key)
                    ).map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVar(v.key)}
                        className="rounded-lg border bg-muted/40 px-2 py-1 text-[11px] font-mono hover:bg-brand-orange/10 hover:border-brand-orange/40"
                        title={v.label}
                      >
                        {`{{${v.key}}}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    onClick={() => void save()}
                    disabled={saving}
                    className="rounded-xl bg-primary"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1.5" />
                        Salvar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void testSend()}
                    disabled={testing}
                    className="rounded-xl"
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1.5" />
                        Testar envio
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-brand-orange/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-brand-orange" />
                  Preview ao vivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl bg-[#ECE5DD] p-4">
                  <div className="max-w-sm rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-sm text-sm whitespace-pre-wrap">
                    {preview || (
                      <span className="text-muted-foreground">
                        Digite o template…
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione um template
          </p>
        )}
      </div>
    </div>
  );
}
