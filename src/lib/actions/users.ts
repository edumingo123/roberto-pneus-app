"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/action-result";
import {
  createUser,
  deleteUser,
  updateUser,
  type CreateUserResult,
  type UserFormInput,
} from "@/lib/data/users";
import { toUserInput, userFormSchema } from "@/lib/validations/user";
import type { UserRecord } from "@/lib/data/types";

function parseInput(raw: unknown): UserFormInput {
  const parsed = userFormSchema.parse(raw);
  return toUserInput(parsed);
}

export async function createUserAction(
  raw: unknown
): Promise<ActionResult<CreateUserResult>> {
  try {
    const session = await requireRole("ADMIN");
    const input = parseInput(raw);
    const result = await createUser(session.user.tenantId, input);
    revalidatePath("/usuarios");
    return ok(
      result,
      result.temporaryPassword
        ? `Usuário criado. Senha temporária: ${result.temporaryPassword}`
        : "Usuário criado"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao criar usuário");
  }
}

export async function updateUserAction(
  id: string,
  raw: unknown
): Promise<ActionResult<UserRecord>> {
  try {
    const session = await requireRole("ADMIN");
    const input = parseInput(raw);
    const user = await updateUser(session.user.tenantId, id, input);
    if (!user) return fail("Usuário não encontrado");
    revalidatePath("/usuarios");
    revalidatePath(`/usuarios/${id}`);
    return ok(user, "Usuário atualizado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao atualizar usuário");
  }
}

export async function deleteUserAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRole("ADMIN");
    const done = await deleteUser(
      session.user.tenantId,
      id,
      session.user.id
    );
    if (!done) return fail("Usuário não encontrado");
    revalidatePath("/usuarios");
    return ok({ id }, "Usuário desativado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao desativar usuário");
  }
}
