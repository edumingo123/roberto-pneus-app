import { createWhatsAppProvider } from "./provider";
import { renderTemplate, type TemplateVariables } from "./types";
import { isDemoMode } from "@/lib/auth/session";
import { getDemoStore, newId } from "@/lib/data/demo-store";
import type { WhatsAppMessageLogRecord } from "@/lib/data/types";
import { DEFAULT_WHATSAPP_TEMPLATES } from "./templates-catalog";

/**
 * WhatsAppService — abstraction over Evolution API (and future providers).
 * Always logs to WhatsAppMessageLog. Demo mode only simulates send.
 */
export class WhatsAppService {
  constructor(private readonly tenantId: string) {}

  private resolveTemplateBody(templateKey: string): string | null {
    const store = getDemoStore();
    const tpl = store.whatsappTemplates.find(
      (t) =>
        t.tenantId === this.tenantId &&
        t.key === templateKey &&
        t.isActive
    );
    if (tpl) return tpl.body;

    const def = DEFAULT_WHATSAPP_TEMPLATES.find((t) => t.key === templateKey);
    return def?.body ?? null;
  }

  private log(entry: Omit<WhatsAppMessageLogRecord, "id" | "updatedAt">) {
    const store = getDemoStore();
    if (!store.whatsappLogs) store.whatsappLogs = [];
    const ts = new Date().toISOString();
    const record: WhatsAppMessageLogRecord = {
      id: newId(),
      ...entry,
      updatedAt: ts,
    };
    store.whatsappLogs.unshift(record);
    return record;
  }

  async sendTemplate(params: {
    toPhone: string;
    templateKey: string;
    variables: TemplateVariables;
    mediaUrl?: string;
  }): Promise<{
    success: boolean;
    body: string;
    logId: string;
    externalId?: string;
    error?: string;
  }> {
    // Normalize variable aliases
    const vars: TemplateVariables = {
      ...params.variables,
      nome_cliente:
        params.variables.nome_cliente ?? params.variables.cliente_nome,
      cliente_nome:
        params.variables.cliente_nome ?? params.variables.nome_cliente,
      numero_os: params.variables.numero_os ?? params.variables.os_numero,
      os_numero: params.variables.os_numero ?? params.variables.numero_os,
      link_os: params.variables.link_os ?? params.variables.link_publico,
      link_publico: params.variables.link_publico ?? params.variables.link_os,
      valor_total: params.variables.valor_total ?? params.variables.total,
      total: params.variables.total ?? params.variables.valor_total,
    };

    const templateBody = this.resolveTemplateBody(params.templateKey);
    if (!templateBody) {
      const log = this.log({
        tenantId: this.tenantId,
        toPhone: params.toPhone,
        templateKey: params.templateKey,
        body: "",
        status: "FAILED",
        externalId: null,
        errorMessage: `Template inativo ou inexistente: ${params.templateKey}`,
        createdAt: new Date().toISOString(),
      });
      return {
        success: false,
        body: "",
        logId: log.id,
        error: log.errorMessage ?? undefined,
      };
    }

    const body = renderTemplate(templateBody, vars);
    const provider = createWhatsAppProvider();

    try {
      // Demo or unconfigured: mock
      if (isDemoMode() || !provider.isConfigured()) {
        console.info(
          "[WhatsAppService:DEMO]",
          params.templateKey,
          params.toPhone,
          body.slice(0, 120)
        );
        const log = this.log({
          tenantId: this.tenantId,
          toPhone: params.toPhone,
          templateKey: params.templateKey,
          body,
          status: "SENT",
          externalId: `demo-${Date.now()}`,
          errorMessage: null,
          createdAt: new Date().toISOString(),
        });
        return {
          success: true,
          body,
          logId: log.id,
          externalId: log.externalId ?? undefined,
        };
      }

      const result = await provider.sendMessage({
        to: params.toPhone,
        body,
        templateKey: params.templateKey,
        mediaUrl: params.mediaUrl,
      });

      const log = this.log({
        tenantId: this.tenantId,
        toPhone: params.toPhone,
        templateKey: params.templateKey,
        body,
        status: result.success ? "SENT" : "FAILED",
        externalId: result.externalId ?? null,
        errorMessage: result.error ?? null,
        createdAt: new Date().toISOString(),
      });

      return {
        success: result.success,
        body,
        logId: log.id,
        externalId: result.externalId,
        error: result.error,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro no envio";
      const log = this.log({
        tenantId: this.tenantId,
        toPhone: params.toPhone,
        templateKey: params.templateKey,
        body,
        status: "FAILED",
        externalId: null,
        errorMessage: msg,
        createdAt: new Date().toISOString(),
      });
      return { success: false, body, logId: log.id, error: msg };
    }
  }

  async sendRaw(params: {
    toPhone: string;
    body: string;
  }): Promise<{ success: boolean; logId: string }> {
    const provider = createWhatsAppProvider();
    console.info("[WhatsAppService:RAW]", params.toPhone, params.body.slice(0, 80));
    const result = await provider.sendMessage({
      to: params.toPhone,
      body: params.body,
    });
    const log = this.log({
      tenantId: this.tenantId,
      toPhone: params.toPhone,
      templateKey: null,
      body: params.body,
      status: result.success ? "SENT" : "FAILED",
      externalId: result.externalId ?? null,
      errorMessage: result.error ?? null,
      createdAt: new Date().toISOString(),
    });
    return { success: result.success, logId: log.id };
  }

  listLogs(limit = 50): WhatsAppMessageLogRecord[] {
    const store = getDemoStore();
    return (store.whatsappLogs ?? [])
      .filter((l) => l.tenantId === this.tenantId)
      .slice(0, limit);
  }
}

export function createWhatsAppService(tenantId: string) {
  return new WhatsAppService(tenantId);
}
