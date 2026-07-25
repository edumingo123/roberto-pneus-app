"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireSession } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/action-result";
import { listTemplates, toggleTemplate, updateTemplate } from "@/lib/data/templates";
import { createWhatsAppService } from "@/lib/whatsapp/service";
import type { WhatsAppTemplateRecord } from "@/lib/data/types";
import { getDemoStore } from "@/lib/data/demo-store";

export async function listTemplatesAction(): Promise<
  ActionResult<WhatsAppTemplateRecord[]>
> {
  try {
    const session = await requireSession();
    const items = await listTemplates(session.user.tenantId);
    return ok(items);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao listar templates");
  }
}

export async function updateTemplateAction(
  id: string,
  data: { name?: string; body?: string; isActive?: boolean }
): Promise<ActionResult<WhatsAppTemplateRecord>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const item = await updateTemplate(session.user.tenantId, id, data);
    if (!item) return fail("Template não encontrado");
    revalidatePath("/configuracoes/templates");
    return ok(item, "Template salvo");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao salvar");
  }
}

export async function toggleTemplateAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<WhatsAppTemplateRecord>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const item = await toggleTemplate(session.user.tenantId, id, isActive);
    if (!item) return fail("Template não encontrado");
    revalidatePath("/configuracoes/templates");
    return ok(item, isActive ? "Template ativado" : "Template desativado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro");
  }
}

export async function testTemplateSendAction(
  templateKey: string
): Promise<ActionResult<{ body: string }>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const store = getDemoStore();
    const client = store.clients.find((c) => c.tenantId === session.user.tenantId);
    const phone = client?.whatsapp || "11999999999";

    const service = createWhatsAppService(session.user.tenantId);
    const result = await service.sendTemplate({
      toPhone: phone,
      templateKey,
      variables: {
        nome_cliente: client?.name ?? "Cliente Teste",
        placa: "ABC1D23",
        veiculo: "Hyundai HB20",
        numero_os: "1042",
        status: "Em execução",
        valor_total: "530,00",
        previsao: "Hoje às 17h",
        link_os: "http://localhost:3000/acompanhamento/demo",
        mecanico: "Carlos Mecânico",
        data: new Date().toLocaleDateString("pt-BR"),
        horario: "14:30",
        oficina_nome: session.tenant.name,
      },
    });

    if (!result.success) {
      return fail(result.error || "Falha no envio de teste");
    }

    return ok(
      { body: result.body },
      `Teste enviado (simulado) para ${phone}`
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro no teste");
  }
}

export async function listWhatsAppLogsAction() {
  try {
    const session = await requireSession();
    const service = createWhatsAppService(session.user.tenantId);
    return ok(service.listLogs(30));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro");
  }
}
