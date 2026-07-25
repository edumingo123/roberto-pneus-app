import type {
  WhatsAppMessagePayload,
  WhatsAppProvider,
  WhatsAppSendResult,
} from "./types";

/**
 * Evolution API provider.
 * When configured, POSTs to /message/sendText/{instance}.
 * When not configured / DEMO, returns mock success (caller logs).
 */
export class EvolutionApiProvider implements WhatsAppProvider {
  readonly name = "evolution";

  constructor(
    private readonly baseUrl?: string,
    private readonly apiKey?: string,
    private readonly instance?: string
  ) {}

  isConfigured(): boolean {
    return Boolean(
      this.baseUrl &&
        this.apiKey &&
        this.instance &&
        !this.baseUrl.includes("your-")
    );
  }

  async sendMessage(
    payload: WhatsAppMessagePayload
  ): Promise<WhatsAppSendResult> {
    if (!this.isConfigured()) {
      console.info(
        "[whatsapp:evolution:mock]",
        payload.to,
        payload.templateKey ?? "raw",
        payload.body.slice(0, 100)
      );
      return {
        success: true,
        externalId: `mock-${Date.now()}`,
      };
    }

    const base = this.baseUrl!.replace(/\/$/, "");
    const url = `${base}/message/sendText/${this.instance}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.apiKey!,
        },
        body: JSON.stringify({
          number: payload.to.replace(/\D/g, ""),
          text: payload.body,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          success: false,
          error: `Evolution API ${res.status}: ${text.slice(0, 200)}`,
        };
      }

      const data = (await res.json().catch(() => ({}))) as {
        key?: { id?: string };
        messageId?: string;
      };

      return {
        success: true,
        externalId: data.key?.id || data.messageId || `evo-${Date.now()}`,
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Falha na Evolution API",
      };
    }
  }
}

export function createWhatsAppProvider(): WhatsAppProvider {
  return new EvolutionApiProvider(
    process.env.EVOLUTION_API_URL,
    process.env.EVOLUTION_API_KEY,
    process.env.EVOLUTION_INSTANCE
  );
}
