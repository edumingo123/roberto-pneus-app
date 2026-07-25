import type { TemplateVariables } from "./types";
import { createWhatsAppService } from "./service";
import { templateKeyForOsStatus } from "./templates-catalog";

/**
 * High-level helper used by OS / appointments.
 * Delegates to WhatsAppService (templates + logs).
 */
export async function sendTemplatedWhatsApp(params: {
  tenantId: string;
  toPhone: string;
  templateKey: string;
  variables: TemplateVariables;
  fallbackBody?: string;
}): Promise<{ success: boolean; body: string }> {
  const service = createWhatsAppService(params.tenantId);
  const result = await service.sendTemplate({
    toPhone: params.toPhone,
    templateKey: params.templateKey,
    variables: params.variables,
  });
  return { success: result.success, body: result.body };
}

export function publicAppUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export { templateKeyForOsStatus };
