import { getDemoStore, newId } from "./demo-store";
import {
  DEFAULT_WHATSAPP_TEMPLATES,
} from "@/lib/whatsapp/templates-catalog";
import type { WhatsAppTemplateRecord } from "./types";

export async function listTemplates(
  tenantId: string
): Promise<WhatsAppTemplateRecord[]> {
  const store = getDemoStore();
  // ensure defaults exist
  for (const def of DEFAULT_WHATSAPP_TEMPLATES) {
    if (
      !store.whatsappTemplates.some(
        (t) => t.tenantId === tenantId && t.key === def.key
      )
    ) {
      store.whatsappTemplates.push({
        id: newId(),
        tenantId,
        key: def.key,
        name: def.name,
        body: def.body,
        isActive: true,
        description: def.description,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return store.whatsappTemplates
    .filter((t) => t.tenantId === tenantId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateTemplate(
  tenantId: string,
  id: string,
  data: { name?: string; body?: string; isActive?: boolean }
): Promise<WhatsAppTemplateRecord | null> {
  const store = getDemoStore();
  const idx = store.whatsappTemplates.findIndex(
    (t) => t.id === id && t.tenantId === tenantId
  );
  if (idx < 0) return null;
  store.whatsappTemplates[idx] = {
    ...store.whatsappTemplates[idx],
    name: data.name ?? store.whatsappTemplates[idx].name,
    body: data.body ?? store.whatsappTemplates[idx].body,
    isActive:
      data.isActive !== undefined
        ? data.isActive
        : store.whatsappTemplates[idx].isActive,
    updatedAt: new Date().toISOString(),
  };
  return store.whatsappTemplates[idx];
}

export async function toggleTemplate(
  tenantId: string,
  id: string,
  isActive: boolean
): Promise<WhatsAppTemplateRecord | null> {
  return updateTemplate(tenantId, id, { isActive });
}
