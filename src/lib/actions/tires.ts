"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireSession } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/action-result";
import {
  adjustTireStock,
  createTire,
  createTireInterest,
  deleteTire,
  updateTire,
  type TireFormInput,
} from "@/lib/data/tires";
import type { TireInterestRecord, TireRecord } from "@/lib/data/types";
import { z } from "zod";

const tireSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  size: z.string().min(3),
  type: z.enum([
    "PASSEIO",
    "SUV",
    "CAMINHONETE",
    "CORRIDA",
    "OFF_ROAD",
    "COMERCIAL",
    "MOTO",
    "OUTRO",
  ]),
  price: z.string().min(1),
  promoPrice: z.string().optional(),
  isPromo: z.boolean().optional(),
  stockQty: z.string().min(1),
  minStock: z.string().optional(),
  loadIndex: z.string().optional(),
  speedRating: z.string().optional(),
  season: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  compatibleMakes: z.string().optional(), // comma-separated
  compatibleModels: z.string().optional(),
  isActive: z.boolean().optional(),
});

function toInput(raw: z.infer<typeof tireSchema>): TireFormInput {
  const price = Number(raw.price);
  const promo =
    raw.promoPrice && raw.promoPrice !== ""
      ? Number(raw.promoPrice)
      : null;
  return {
    brand: raw.brand,
    model: raw.model,
    size: raw.size,
    type: raw.type,
    price,
    promoPrice: promo,
    isPromo: !!raw.isPromo && promo != null,
    stockQty: Number(raw.stockQty) || 0,
    minStock: raw.minStock ? Number(raw.minStock) : 2,
    loadIndex: raw.loadIndex || null,
    speedRating: raw.speedRating || null,
    season: raw.season || null,
    sku: raw.sku || null,
    description: raw.description || null,
    imageUrl: raw.imageUrl || null,
    imageUrls: raw.imageUrl ? [raw.imageUrl] : [],
    compatibleMakes: raw.compatibleMakes
      ? raw.compatibleMakes.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    compatibleModels: raw.compatibleModels
      ? raw.compatibleModels.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    isActive: raw.isActive !== false,
  };
}

export async function createTireAction(
  raw: unknown
): Promise<ActionResult<TireRecord>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const parsed = tireSchema.parse(raw);
    const tire = await createTire(session.user.tenantId, toInput(parsed));
    revalidatePath("/pneus");
    return ok(tire, "Pneu cadastrado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao cadastrar");
  }
}

export async function updateTireAction(
  id: string,
  raw: unknown
): Promise<ActionResult<TireRecord>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const parsed = tireSchema.parse(raw);
    const tire = await updateTire(
      session.user.tenantId,
      id,
      toInput(parsed)
    );
    if (!tire) return fail("Pneu não encontrado");
    revalidatePath("/pneus");
    return ok(tire, "Pneu atualizado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao atualizar");
  }
}

export async function adjustStockAction(
  id: string,
  delta: number
): Promise<ActionResult<TireRecord>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const tire = await adjustTireStock(session.user.tenantId, id, delta);
    if (!tire) return fail("Pneu não encontrado");
    revalidatePath("/pneus");
    return ok(tire, "Estoque atualizado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro no estoque");
  }
}

export async function deleteTireAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(["ADMIN", "RECEPCIONISTA"]);
    const session = await requireSession();
    const done = await deleteTire(session.user.tenantId, id);
    if (!done) return fail("Pneu não encontrado");
    revalidatePath("/pneus");
    return ok({ id }, "Pneu desativado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao remover");
  }
}

export async function tireInterestAction(params: {
  tireId: string;
  quantity: number;
  type: "ORCAMENTO" | "COMPRA";
  clientName?: string;
  clientPhone?: string;
  notes?: string;
}): Promise<ActionResult<TireInterestRecord>> {
  try {
    const session = await requireSession();
    const rec = await createTireInterest({
      tenantId: session.user.tenantId,
      tireId: params.tireId,
      quantity: params.quantity,
      type: params.type,
      clientName: params.clientName,
      clientPhone: params.clientPhone,
      notes: params.notes,
    });
    revalidatePath("/pneus");
    return ok(
      rec,
      params.type === "COMPRA"
        ? "Pedido registrado — equipe entrará em contato"
        : "Solicitação de orçamento registrada"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao registrar");
  }
}
