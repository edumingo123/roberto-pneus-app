"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireSession } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/action-result";
import {
  createMaintenanceType,
  deleteMaintenanceType,
  updateMaintenanceType,
  type MaintenanceTypeFormInput,
} from "@/lib/data/maintenance-types";
import {
  maintenanceTypeFormSchema,
  toMaintenanceTypeInput,
} from "@/lib/validations/maintenance-type";
import type { MaintenanceTypeRecord } from "@/lib/data/types";

function parseInput(raw: unknown): MaintenanceTypeFormInput {
  const parsed = maintenanceTypeFormSchema.parse(raw);
  return toMaintenanceTypeInput(parsed);
}

export async function createMaintenanceTypeAction(
  raw: unknown
): Promise<ActionResult<MaintenanceTypeRecord>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const input = parseInput(raw);
    const item = await createMaintenanceType(session.user.tenantId, input);
    revalidatePath("/tipos-manutencao");
    revalidatePath("/manutencao");
    return ok(item, "Tipo de manutenção criado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao criar tipo");
  }
}

export async function updateMaintenanceTypeAction(
  id: string,
  raw: unknown
): Promise<ActionResult<MaintenanceTypeRecord>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const input = parseInput(raw);
    const item = await updateMaintenanceType(
      session.user.tenantId,
      id,
      input
    );
    if (!item) return fail("Tipo não encontrado");
    revalidatePath("/tipos-manutencao");
    revalidatePath("/manutencao");
    return ok(item, "Tipo atualizado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao atualizar tipo");
  }
}

export async function deleteMaintenanceTypeAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const done = await deleteMaintenanceType(session.user.tenantId, id);
    if (!done) return fail("Tipo não encontrado");
    revalidatePath("/tipos-manutencao");
    return ok({ id }, "Tipo removido/desativado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao remover tipo");
  }
}
