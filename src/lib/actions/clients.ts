"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/action-result";
import {
  createClient,
  deleteClient,
  updateClient,
  type ClientFormInput,
} from "@/lib/data/clients";
import { clientFormSchema } from "@/lib/validations/client";
import type { ClientRecord } from "@/lib/data/types";

function parseClientInput(raw: unknown): ClientFormInput {
  const parsed = clientFormSchema.parse(raw);
  return {
    ...parsed,
    email: parsed.email || null,
    birthDate: parsed.birthDate || null,
    addressComplement: parsed.addressComplement || null,
    notes: parsed.notes || null,
  };
}

export async function createClientAction(
  raw: unknown
): Promise<ActionResult<ClientRecord>> {
  try {
    const session = await requireSession();
    const input = parseClientInput(raw);
    const client = await createClient(session.user.tenantId, input);
    revalidatePath("/clientes");
    return ok(client, "Cliente cadastrado com sucesso");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao cadastrar cliente");
  }
}

export async function updateClientAction(
  id: string,
  raw: unknown
): Promise<ActionResult<ClientRecord>> {
  try {
    const session = await requireSession();
    const input = parseClientInput(raw);
    const client = await updateClient(session.user.tenantId, id, input);
    if (!client) return fail("Cliente não encontrado");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return ok(client, "Cliente atualizado com sucesso");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao atualizar cliente");
  }
}

export async function deleteClientAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    const done = await deleteClient(session.user.tenantId, id);
    if (!done) return fail("Cliente não encontrado");
    revalidatePath("/clientes");
    return ok({ id }, "Cliente excluído");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao excluir cliente");
  }
}
