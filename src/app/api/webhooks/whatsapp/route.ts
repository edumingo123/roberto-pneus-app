import { NextResponse } from "next/server";
import { processWhatsAppAgentMessage } from "@/lib/ia-agent";
import { DEMO_TENANT_ID } from "@/lib/data/demo-store";

/**
 * Evolution API webhook — inbound messages → AI Agent.
 *
 * Expected Evolution payload shapes vary; we normalize common fields.
 * Tenant resolution: EVOLUTION_INSTANCE → tenant (demo uses DEMO_TENANT_ID).
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    console.info(
      "[webhook:whatsapp]",
      JSON.stringify(payload)?.slice(0, 800)
    );

    if (!payload) {
      return NextResponse.json({ ok: false, error: "empty body" }, { status: 400 });
    }

    // Normalize Evolution / generic inbound
    const data = (payload.data ?? payload) as Record<string, unknown>;
    const key = (data.key ?? {}) as Record<string, unknown>;
    const fromMe = Boolean(key.fromMe ?? data.fromMe);
    if (fromMe) {
      return NextResponse.json({ ok: true, ignored: "fromMe" });
    }

    const phoneRaw =
      (key.remoteJid as string) ||
      (data.remoteJid as string) ||
      (data.from as string) ||
      (payload.phone as string) ||
      "";
    const phone = String(phoneRaw)
      .replace("@s.whatsapp.net", "")
      .replace(/\D/g, "");

    const messageObj = (data.message ?? payload.message ?? {}) as Record<
      string,
      unknown
    >;
    const text =
      (messageObj.conversation as string) ||
      ((messageObj.extendedTextMessage as { text?: string })?.text ?? "") ||
      (data.body as string) ||
      (payload.text as string) ||
      (payload.message as string) ||
      "";

    if (!phone || !text || typeof text !== "string") {
      return NextResponse.json({
        ok: true,
        ignored: "no phone/text",
      });
    }

    // Multi-tenant: map instance name if provided
    const instance =
      (payload.instance as string) ||
      process.env.EVOLUTION_INSTANCE ||
      "default";
    const tenantId =
      process.env.DEFAULT_TENANT_ID || DEMO_TENANT_ID;

    const result = await processWhatsAppAgentMessage({
      tenantId,
      phone,
      message: text,
      sendReply: true,
    });

    return NextResponse.json({
      ok: true,
      instance,
      mode: result.mode,
      conversationId: result.conversationId,
      tools: result.toolCalls.map((t) => t.name),
      replyPreview: result.reply.slice(0, 200),
    });
  } catch (e) {
    console.error("[webhook:whatsapp]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "roberto-pneus-whatsapp-webhook",
    agent: "ia-agent",
    status: "ready",
    tools: [
      "buscar_pneus",
      "verificar_compatibilidade",
      "consultar_estoque",
      "criar_agendamento",
      "consultar_status_os",
      "informacoes_oficina",
    ],
  });
}
