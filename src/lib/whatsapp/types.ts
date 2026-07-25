/**
 * Abstraction layer for WhatsApp providers (Evolution API first).
 * Swap implementations without touching business code.
 */

export interface WhatsAppSendResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface WhatsAppMessagePayload {
  to: string;
  body: string;
  templateKey?: string;
  mediaUrl?: string;
}

export interface WhatsAppProvider {
  readonly name: string;
  sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult>;
  isConfigured(): boolean;
}

export type TemplateVariables = Record<string, string | number | null | undefined>;

export function renderTemplate(
  body: string,
  vars: TemplateVariables
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value == null ? "" : String(value);
  });
}
