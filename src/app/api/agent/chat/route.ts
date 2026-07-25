import { NextResponse } from "next/server";
import { processWhatsAppAgentMessage } from "@/lib/ia-agent";
import { DEMO_TENANT_ID } from "@/lib/data/demo-store";
import { isDemoMode } from "@/lib/auth/session";

/**
 * Internal/demo endpoint to test the AI agent without WhatsApp.
 * POST { message, phone?, tenantId? }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      phone?: string;
      tenantId?: string;
      clientName?: string;
    };

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const result = await processWhatsAppAgentMessage({
      tenantId: body.tenantId || DEMO_TENANT_ID,
      phone: body.phone || "11999990000",
      message: body.message,
      clientName: body.clientName,
      sendReply: false, // don't double-send via WA in playground
    });

    return NextResponse.json({
      ok: true,
      demo: isDemoMode(),
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
