"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/action-result";
import {
  addVehicleDocument,
  createVehicle,
  deleteVehicle,
  deleteVehicleDocument,
  extractVehicleDocumentStoragePath,
  updateVehicle,
  updateVehicleKm,
  type VehicleFormInput,
} from "@/lib/data/vehicles";
import {
  toVehicleInput,
  vehicleFormSchema,
  vehicleKmSchema,
} from "@/lib/validations/vehicle";
import type { VehicleDocumentRecord, VehicleRecord } from "@/lib/data/types";

function parseVehicleInput(raw: unknown): VehicleFormInput {
  const parsed = vehicleFormSchema.parse(raw);
  return toVehicleInput(parsed) as VehicleFormInput;
}

export async function createVehicleAction(
  raw: unknown
): Promise<ActionResult<VehicleRecord>> {
  try {
    const session = await requireSession();
    const input = parseVehicleInput(raw);
    const vehicle = await createVehicle(session.user.tenantId, input);
    revalidatePath("/veiculos");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${input.clientId}`);
    return ok(vehicle, "Veículo cadastrado com sucesso");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao cadastrar veículo");
  }
}

export async function updateVehicleAction(
  id: string,
  raw: unknown
): Promise<ActionResult<VehicleRecord>> {
  try {
    const session = await requireSession();
    const input = parseVehicleInput(raw);
    const vehicle = await updateVehicle(session.user.tenantId, id, input);
    if (!vehicle) return fail("Veículo não encontrado");
    revalidatePath("/veiculos");
    revalidatePath(`/veiculos/${id}`);
    revalidatePath(`/clientes/${input.clientId}`);
    return ok(vehicle, "Veículo atualizado com sucesso");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao atualizar veículo");
  }
}

export async function deleteVehicleAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    const done = await deleteVehicle(session.user.tenantId, id);
    if (!done) return fail("Veículo não encontrado");
    revalidatePath("/veiculos");
    revalidatePath("/clientes");
    return ok({ id }, "Veículo removido");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao remover veículo");
  }
}

/** Prepare for Phase 3 OS — KM obrigatória atualiza o veículo */
export async function updateVehicleKmAction(
  raw: unknown
): Promise<ActionResult<VehicleRecord>> {
  try {
    const session = await requireSession();
    const { vehicleId, km } = vehicleKmSchema.parse(raw);
    const vehicle = await updateVehicleKm(
      session.user.tenantId,
      vehicleId,
      km
    );
    if (!vehicle) return fail("Veículo não encontrado");
    revalidatePath("/veiculos");
    revalidatePath(`/veiculos/${vehicleId}`);
    return ok(vehicle, "KM atualizada");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao atualizar KM");
  }
}

export async function uploadVehicleDocumentAction(formData: FormData): Promise<
  ActionResult<VehicleDocumentRecord>
> {
  try {
    const session = await requireSession();
    const vehicleId = String(formData.get("vehicleId") ?? "");
    const file = formData.get("file");

    if (!vehicleId) return fail("Veículo não informado");
    if (!(file instanceof File) || file.size === 0) {
      return fail("Selecione um arquivo");
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      return fail("Apenas imagens (JPG, PNG, WEBP) ou PDF");
    }
    if (file.size > 5 * 1024 * 1024) {
      return fail("Arquivo deve ter no máximo 5MB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Demo / fallback: data URL. Production: upload to Supabase Storage.
    let fileUrl = dataUrl;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      serviceKey &&
      url &&
      !url.includes("your-project") &&
      process.env.DEMO_MODE !== "true"
    ) {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(url, serviceKey);
      const path = `${session.user.tenantId}/${vehicleId}/${Date.now()}-${file.name}`;
      const { error } = await admin.storage
        .from("vehicle-documents")
        .upload(path, buffer, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      const { data } = admin.storage.from("vehicle-documents").getPublicUrl(path);
      fileUrl = data.publicUrl;
    }

    const doc = await addVehicleDocument(session.user.tenantId, vehicleId, {
      name: file.name,
      fileUrl,
      fileType: file.type,
      sizeBytes: file.size,
    });

    revalidatePath(`/veiculos/${vehicleId}`);
    return ok(doc, "Arquivo enviado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro no upload");
  }
}

export async function deleteVehicleDocumentAction(
  documentId: string
): Promise<ActionResult<{ id: string; vehicleId: string }>> {
  try {
    const session = await requireSession();
    if (!documentId?.trim()) return fail("Documento não informado");

    const deleted = await deleteVehicleDocument(
      session.user.tenantId,
      documentId
    );
    if (!deleted) return fail("Arquivo não encontrado");

    // Remove from Supabase Storage when applicable (non-demo, real public URL)
    const storagePath = extractVehicleDocumentStoragePath(deleted.fileUrl);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      storagePath &&
      serviceKey &&
      url &&
      !url.includes("your-project") &&
      process.env.DEMO_MODE !== "true"
    ) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const admin = createClient(url, serviceKey);
        const { error } = await admin.storage
          .from("vehicle-documents")
          .remove([storagePath]);
        if (error) {
          console.warn(
            "[vehicle-documents] storage remove failed:",
            error.message
          );
        }
      } catch (storageErr) {
        console.warn("[vehicle-documents] storage remove error:", storageErr);
      }
    }

    revalidatePath(`/veiculos/${deleted.vehicleId}`);
    revalidatePath("/veiculos");
    return ok(
      { id: deleted.id, vehicleId: deleted.vehicleId },
      "Arquivo excluído com sucesso"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao excluir arquivo");
  }
}
