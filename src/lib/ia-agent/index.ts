/**
 * Agente de IA WhatsApp — Function Calling (OpenAI GPT-4o-mini)
 * Em DEMO ou sem OPENAI_API_KEY: responde com lógica heurística + tools.
 */
import OpenAI from "openai";
import { isDemoMode } from "@/lib/auth/session";
import { getDemoStore, newId } from "@/lib/data/demo-store";
import { AGENT_TOOLS_OPENAI, executeAgentTool } from "./tools";
import { createWhatsAppService } from "@/lib/whatsapp/service";

const SYSTEM_PROMPT = `Você é o assistente virtual da Roberto Pneus, oficina e centro automotivo autorizado Michelin.
Tom: profissional, cordial e objetivo. Respostas curtas e claras em português do Brasil.
Você pode:
- Consultar catálogo de pneus (preço, estoque, compatibilidade)
- Criar agendamentos (ficam pendentes de aprovação)
- Consultar status de ordens de serviço
- Informar horário e formas de pagamento
Sempre use as ferramentas quando precisar de dados reais do catálogo/estoque/OS.
Não invente preços ou estoque — use as tools.
Se não souber algo, diga que a equipe humana entrará em contato.`;

export interface AgentReply {
  reply: string;
  toolCalls: Array<{ name: string; args: unknown; result: unknown }>;
  mode: "openai" | "demo";
  conversationId: string;
}

function getOrCreateAiConversation(
  tenantId: string,
  phone: string,
  clientName?: string | null
) {
  const store = getDemoStore();
  let conv = store.aiConversations.find(
    (c) => c.tenantId === tenantId && c.phone === phone
  );
  if (!conv) {
    const ts = new Date().toISOString();
    conv = {
      id: newId(),
      tenantId,
      phone,
      clientName: clientName ?? null,
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    };
    store.aiConversations.push(conv);
  }
  return conv;
}

function logAiMessage(
  conversationId: string,
  direction: "INBOUND" | "OUTBOUND",
  content: string,
  functionCalls?: unknown
) {
  const store = getDemoStore();
  store.aiMessages.push({
    id: newId(),
    conversationId,
    direction,
    content,
    functionCalls: functionCalls ?? null,
    createdAt: new Date().toISOString(),
  });
}

/** Simple DEMO agent without OpenAI — pattern matching + tools */
async function runDemoAgent(
  tenantId: string,
  phone: string,
  message: string,
  clientName?: string | null
): Promise<AgentReply> {
  const conv = getOrCreateAiConversation(tenantId, phone, clientName);
  logAiMessage(conv.id, "INBOUND", message);
  const toolCalls: AgentReply["toolCalls"] = [];
  const lower = message.toLowerCase();
  let reply = "";

  if (
    lower.includes("horário") ||
    lower.includes("funcionamento") ||
    lower.includes("endereço") ||
    lower.includes("pagamento") ||
    lower.includes("pix")
  ) {
    const result = await executeAgentTool(tenantId, "informacoes_oficina", {});
    toolCalls.push({ name: "informacoes_oficina", args: {}, result });
    const info = result as {
      nome: string;
      horario: Record<string, string>;
      formas_pagamento: string[];
    };
    reply = `📍 *${info.nome}*\nSeg–Sex: ${info.horario.segunda_sexta}\nSáb: ${info.horario.sabado}\nDom: ${info.horario.domingo}\nPagamento: ${info.formas_pagamento.join(", ")}.`;
  } else if (
    lower.includes("os") ||
    lower.includes("ordem") ||
    lower.includes("status") ||
    /placa|abc|xyz/i.test(message)
  ) {
    const plateMatch = message.toUpperCase().match(/[A-Z]{3}\s*\d[A-Z0-9]\d{2}|[A-Z]{3}\s*\d{4}/);
    const numMatch = message.match(/#?\s*(\d{3,5})/);
    const args: Record<string, unknown> = {};
    if (plateMatch) args.placa = plateMatch[0].replace(/\s+/g, "");
    if (numMatch) args.numero_os = Number(numMatch[1]);
    if (!args.placa && !args.numero_os) args.placa = "ABC1D23";
    const result = await executeAgentTool(
      tenantId,
      "consultar_status_os",
      args
    );
    toolCalls.push({ name: "consultar_status_os", args, result });
    const list = result as Array<{ numero: number; status: string; placa?: string }>;
    if (!Array.isArray(list) || !list.length) {
      reply =
        "Não encontrei OS com esses dados. Informe a *placa* ou o *número da OS*.";
    } else {
      reply = list
        .map(
          (o) =>
            `OS #${o.numero} (${o.placa ?? "—"}) → *${o.status}*`
        )
        .join("\n");
    }
  } else if (
    lower.includes("agend") ||
    lower.includes("marcar") ||
    lower.includes("horário disponível")
  ) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const data = tomorrow.toISOString().slice(0, 10);
    const args = {
      nome_cliente: clientName || "Cliente WhatsApp",
      telefone: phone,
      servico: "Atendimento / avaliação de pneus",
      data,
      horario: "10:00",
      observacoes: message,
    };
    const result = await executeAgentTool(tenantId, "criar_agendamento", args);
    toolCalls.push({ name: "criar_agendamento", args, result });
    reply =
      "Criei um *agendamento para amanhã às 10h* com status *Aguardando Aprovação*. Nossa equipe confirma em breve! Se quiser outro horário, é só dizer.";
  } else if (
    lower.includes("pneu") ||
    lower.includes("medida") ||
    lower.includes("estoque") ||
    lower.includes("michelin") ||
    lower.includes("preço") ||
    lower.includes("preco") ||
    lower.includes("civic") ||
    lower.includes("compatib")
  ) {
    const medida =
      message.match(/\d{3}\s*\/\s*\d{2}\s*R\s*\d{2}/i)?.[0] || undefined;
    const marca = lower.includes("michelin")
      ? "Michelin"
      : lower.includes("bridgestone")
        ? "Bridgestone"
        : lower.includes("pirelli")
          ? "Pirelli"
          : undefined;
    const modelo_carro = lower.includes("civic")
      ? "Honda Civic 2020"
      : lower.includes("corolla")
        ? "Toyota Corolla 2020"
        : lower.includes("hilux")
          ? "Toyota Hilux 2020"
          : undefined;

    const args = { medida, marca, modelo_carro };
    const result = await executeAgentTool(tenantId, "buscar_pneus", args);
    toolCalls.push({ name: "buscar_pneus", args, result });
    const data = result as {
      total: number;
      pneus: Array<{
        id: string;
        marca: string;
        modelo: string;
        medida: string;
        preco: number;
        estoque: number;
        promocao: boolean;
      }>;
    };

    if (!data.pneus?.length) {
      reply =
        "Não encontrei pneus com esses filtros. Pode me passar a *medida* (ex: 205/55R16) ou o *modelo do carro*?";
    } else {
      const lines = data.pneus.slice(0, 5).map((p) => {
        const promo = p.promocao ? " 🔥 promo" : "";
        return `• ${p.marca} ${p.modelo} ${p.medida} — R$ ${p.preco.toFixed(0)}${promo} (est: ${p.estoque})`;
      });
      reply = `Encontrei *${data.total}* opção(ões):\n${lines.join("\n")}\n\nQuer que eu verifique compatibilidade ou estoque de algum? Posso também *agendar* a instalação.`;
    }
  } else {
    const result = await executeAgentTool(tenantId, "informacoes_oficina", {});
    toolCalls.push({ name: "informacoes_oficina", args: {}, result });
    reply = `Olá! Sou o assistente da *Roberto Pneus* 👋\nPosso ajudar com:\n• Catálogo e preços de pneus\n• Compatibilidade e estoque\n• Status de OS\n• Agendamentos\n• Horário e pagamentos\n\nComo posso ajudar?`;
  }

  logAiMessage(conv.id, "OUTBOUND", reply, toolCalls);
  conv.updatedAt = new Date().toISOString();
  return { reply, toolCalls, mode: "demo", conversationId: conv.id };
}

async function runOpenAiAgent(
  tenantId: string,
  phone: string,
  message: string,
  clientName?: string | null
): Promise<AgentReply> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return runDemoAgent(tenantId, phone, message, clientName);
  }

  const conv = getOrCreateAiConversation(tenantId, phone, clientName);
  logAiMessage(conv.id, "INBOUND", message);

  const openai = new OpenAI({ apiKey });
  const store = getDemoStore();
  const history = store.aiMessages
    .filter((m) => m.conversationId === conv.id)
    .slice(-12)
    .map((m) => ({
      role:
        m.direction === "INBOUND"
          ? ("user" as const)
          : ("assistant" as const),
      content: m.content,
    }));

  const toolCallsLog: AgentReply["toolCalls"] = [];

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];

  // First completion (may request tools)
  let completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
    tools: AGENT_TOOLS_OPENAI,
    tool_choice: "auto",
    temperature: 0.4,
  });

  let assistantMsg = completion.choices[0]?.message;
  let guard = 0;

  while (assistantMsg?.tool_calls?.length && guard < 5) {
    guard++;
    messages.push(assistantMsg);

    for (const tc of assistantMsg.tool_calls) {
      if (tc.type !== "function") continue;
      const name = tc.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}") as Record<
          string,
          unknown
        >;
      } catch {
        args = {};
      }
      const result = await executeAgentTool(tenantId, name, args);
      toolCallsLog.push({ name, args, result });
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }

    completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      tools: AGENT_TOOLS_OPENAI,
      tool_choice: "auto",
      temperature: 0.4,
    });
    assistantMsg = completion.choices[0]?.message;
  }

  const reply =
    assistantMsg?.content?.trim() ||
    "Desculpe, não consegui processar. Pode reformular?";

  logAiMessage(conv.id, "OUTBOUND", reply, toolCallsLog);
  conv.updatedAt = new Date().toISOString();

  return {
    reply,
    toolCalls: toolCallsLog,
    mode: "openai",
    conversationId: conv.id,
  };
}

/**
 * Process inbound WhatsApp message for the AI agent.
 * Optionally sends reply via WhatsAppService.
 */
export async function processWhatsAppAgentMessage(params: {
  tenantId: string;
  phone: string;
  message: string;
  clientName?: string | null;
  sendReply?: boolean;
}): Promise<AgentReply> {
  const useDemo =
    isDemoMode() ||
    !process.env.OPENAI_API_KEY ||
    process.env.AI_AGENT_FORCE_DEMO === "true";

  const result = useDemo
    ? await runDemoAgent(
        params.tenantId,
        params.phone,
        params.message,
        params.clientName
      )
    : await runOpenAiAgent(
        params.tenantId,
        params.phone,
        params.message,
        params.clientName
      );

  if (params.sendReply !== false) {
    const wa = createWhatsAppService(params.tenantId);
    await wa.sendRaw({
      toPhone: params.phone,
      body: result.reply,
    });
  }

  return result;
}

export { AGENT_TOOLS_OPENAI, executeAgentTool };
