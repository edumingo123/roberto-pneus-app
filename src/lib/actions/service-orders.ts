"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/action-result";
import {
  addServiceOrderPhoto,
  createServiceOrder,
  deleteServiceOrderPhoto,
  getServiceOrderById,
  getServiceOrderByPublicToken,
  setLabor,
  setParts,
  transitionServiceOrderStatus,
  updateServiceOrderInfo,
} from "@/lib/data/service-orders";
import {
  createServiceOrderSchema,
  osInfoSchema,
  statusTransitionSchema,
} from "@/lib/validations/service-order";
import type {
  PhotoType,
  ServiceOrderDetail,
  ServiceOrderRecord,
  ServiceOrderStatus,
} from "@/lib/data/types";
import { osStatusLabel, requiresExitKm } from "@/lib/service-orders/status";
import {
  publicAppUrl,
  sendTemplatedWhatsApp,
  templateKeyForOsStatus,
} from "@/lib/whatsapp/notify";

export async function createServiceOrderAction(
  raw: unknown
): Promise<ActionResult<ServiceOrderRecord>> {
  try {
    const session = await requireSession();
    const parsed = createServiceOrderSchema.parse(raw);
    const os = await createServiceOrder(session.user.tenantId, {
      clientId: parsed.clientId,
      vehicleId: parsed.vehicleId,
      mechanicId: parsed.mechanicId || null,
      kmAtEntry: Number(parsed.kmAtEntry),
      complaint: parsed.complaint || null,
      diagnosis: parsed.diagnosis || null,
      internalNotes: parsed.internalNotes || null,
      createdById: session.user.id,
    });
    revalidatePath("/ordens-servico");
    revalidatePath("/veiculos");
    return ok(os, `OS #${os.number} criada`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao criar OS");
  }
}

export async function updateServiceOrderInfoAction(
  id: string,
  raw: unknown
): Promise<ActionResult<ServiceOrderRecord>> {
  try {
    const session = await requireSession();
    const parsed = osInfoSchema.parse(raw);
    const os = await updateServiceOrderInfo(session.user.tenantId, id, {
      mechanicId: parsed.mechanicId || null,
      complaint: parsed.complaint,
      diagnosis: parsed.diagnosis,
      internalNotes: parsed.internalNotes,
      discount: Number(parsed.discount) || 0,
    });
    if (!os) return fail("OS não encontrada");
    revalidatePath(`/ordens-servico/${id}`);
    return ok(os, "Informações atualizadas");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao salvar");
  }
}

export async function saveServiceOrderPartsAction(
  id: string,
  parts: Array<{
    id?: string;
    description: string;
    brand?: string;
    quantity: string;
    unitPrice: string;
  }>
): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requireSession();
    await setParts(
      session.user.tenantId,
      id,
      parts
        .filter((p) => p.description.trim())
        .map((p) => ({
          id: p.id,
          description: p.description,
          brand: p.brand || null,
          quantity: Number(p.quantity) || 0,
          unitPrice: Number(p.unitPrice) || 0,
        }))
    );
    revalidatePath(`/ordens-servico/${id}`);
    return ok({ count: parts.length }, "Peças atualizadas");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao salvar peças");
  }
}

export async function saveServiceOrderLaborAction(
  id: string,
  items: Array<{
    id?: string;
    description: string;
    hours: string;
    hourlyRate: string;
  }>
): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requireSession();
    await setLabor(
      session.user.tenantId,
      id,
      items
        .filter((p) => p.description.trim())
        .map((p) => ({
          id: p.id,
          description: p.description,
          hours: Number(p.hours) || 0,
          hourlyRate: Number(p.hourlyRate) || 0,
        }))
    );
    revalidatePath(`/ordens-servico/${id}`);
    return ok({ count: items.length }, "Mão de obra atualizada");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao salvar mão de obra");
  }
}

export async function transitionServiceOrderAction(
  id: string,
  raw: unknown
): Promise<ActionResult<ServiceOrderDetail>> {
  try {
    const session = await requireSession();
    const parsed = statusTransitionSchema.parse(raw);
    const toStatus = parsed.toStatus as ServiceOrderStatus;

    if (requiresExitKm(toStatus)) {
      const km = Number(parsed.kmAtExit);
      if (!Number.isFinite(km)) {
        return fail("Informe a KM atual para entregar o veículo");
      }
    }

    const detail = await transitionServiceOrderStatus({
      tenantId: session.user.tenantId,
      id,
      toStatus,
      changedById: session.user.id,
      notes: parsed.notes || null,
      kmAtExit: parsed.kmAtExit ? Number(parsed.kmAtExit) : null,
    });

    // WhatsApp notification via status-specific template
    const templateKey = templateKeyForOsStatus(toStatus);
    await sendTemplatedWhatsApp({
      tenantId: session.user.tenantId,
      toPhone: detail.client.whatsapp,
      templateKey,
      variables: {
        nome_cliente: detail.client.name,
        cliente_nome: detail.client.name,
        numero_os: detail.number,
        os_numero: detail.number,
        placa: detail.vehicle.plate,
        veiculo: `${detail.vehicle.brand} ${detail.vehicle.model}`,
        status: osStatusLabel(toStatus),
        valor_total: detail.grandTotal.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        }),
        mecanico: detail.mechanic?.name ?? "—",
        oficina_nome: session.tenant.name,
        link_os: publicAppUrl(`/acompanhamento/${detail.publicToken}`),
        link_publico: publicAppUrl(`/acompanhamento/${detail.publicToken}`),
        data: new Date().toLocaleDateString("pt-BR"),
        horario: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });

    revalidatePath("/ordens-servico");
    revalidatePath(`/ordens-servico/${id}`);
    revalidatePath("/veiculos");
    return ok(detail, `Status: ${osStatusLabel(toStatus)}`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro na transição");
  }
}

export async function sendBudgetWhatsAppAction(
  id: string
): Promise<ActionResult<{ body: string }>> {
  try {
    const session = await requireSession();
    const detail = await getServiceOrderById(session.user.tenantId, id);
    if (!detail) return fail("OS não encontrada");

    const total = detail.grandTotal.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });

    const result = await sendTemplatedWhatsApp({
      tenantId: session.user.tenantId,
      toPhone: detail.client.whatsapp,
      templateKey: "orcamento_pronto",
      variables: {
        nome_cliente: detail.client.name,
        cliente_nome: detail.client.name,
        numero_os: detail.number,
        os_numero: detail.number,
        placa: detail.vehicle.plate,
        veiculo: `${detail.vehicle.brand} ${detail.vehicle.model}`,
        valor_total: total,
        total,
        link_os: publicAppUrl(`/acompanhamento/${detail.publicToken}`),
        link_publico: publicAppUrl(`/acompanhamento/${detail.publicToken}`),
      },
    });

    return ok(
      { body: result.body },
      result.success
        ? "Orçamento enviado via WhatsApp"
        : "Falha ao enviar WhatsApp"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro no envio");
  }
}

export async function uploadServiceOrderPhotoAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    const osId = String(formData.get("serviceOrderId") ?? "");
    const caption = String(formData.get("caption") ?? "");
    const type = String(formData.get("type") ?? "OUTRO") as PhotoType;
    const file = formData.get("file");

    if (!osId) return fail("OS não informada");
    if (!caption.trim()) return fail("Informe a legenda da foto");
    if (!(file instanceof File) || file.size === 0) {
      return fail("Selecione uma imagem");
    }
    if (!file.type.startsWith("image/")) {
      return fail("Apenas imagens");
    }
    if (file.size > 5 * 1024 * 1024) return fail("Máximo 5MB");

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    const photo = await addServiceOrderPhoto(session.user.tenantId, osId, {
      url: dataUrl,
      caption,
      type: ["ANTES", "DEPOIS", "DIAGNOSTICO", "PECA", "OUTRO"].includes(type)
        ? type
        : "OUTRO",
    });

    revalidatePath(`/ordens-servico/${osId}`);
    return ok({ id: photo.id }, "Foto adicionada");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro no upload");
  }
}

export async function deleteServiceOrderPhotoAction(
  photoId: string,
  osId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    const done = await deleteServiceOrderPhoto(
      session.user.tenantId,
      photoId
    );
    if (!done) return fail("Foto não encontrada");
    revalidatePath(`/ordens-servico/${osId}`);
    return ok({ id: photoId }, "Foto removida");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao remover");
  }
}

/** Public actions (no auth) — validated by publicToken */
export async function publicApproveBudgetAction(
  token: string,
  approve: boolean
): Promise<ActionResult<{ status: string }>> {
  try {
    const detail = await getServiceOrderByPublicToken(token);
    if (!detail) return fail("OS não encontrada");
    if (detail.status !== "ORCAMENTO") {
      return fail("Esta OS não está aguardando aprovação de orçamento");
    }

    const updated = await transitionServiceOrderStatus({
      tenantId: detail.tenantId,
      id: detail.id,
      toStatus: approve ? "APROVADO" : "CANCELADO",
      changedById: null,
      notes: approve
        ? "Cliente aprovou pelo link público"
        : "Cliente recusou pelo link público",
    });

    await sendTemplatedWhatsApp({
      tenantId: detail.tenantId,
      toPhone: detail.client.whatsapp,
      templateKey: "os_status_change",
      variables: {
        cliente_nome: detail.client.name,
        os_numero: detail.number,
        placa: detail.vehicle.plate,
        status: osStatusLabel(updated.status),
        link_publico: publicAppUrl(`/acompanhamento/${detail.publicToken}`),
      },
    });

    revalidatePath(`/acompanhamento/${token}`);
    revalidatePath(`/ordens-servico/${detail.id}`);
    return ok(
      { status: updated.status },
      approve ? "Orçamento aprovado" : "Orçamento recusado"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro na aprovação");
  }
}
