import { getDemoStore, newId } from "./demo-store";
import type {
  TireInterestRecord,
  TireInterestType,
  TireRecord,
  TireType,
} from "./types";

export interface TireFilters {
  q?: string;
  carModel?: string;
  type?: TireType | "TODOS";
  size?: string;
  brands?: string[];
  priceMin?: number;
  priceMax?: number;
  promoOnly?: boolean;
  inStockOnly?: boolean;
  activeOnly?: boolean;
}

export interface TireFormInput {
  brand: string;
  model: string;
  size: string;
  width?: number | null;
  aspectRatio?: number | null;
  rimDiameter?: number | null;
  loadIndex?: string | null;
  speedRating?: string | null;
  type: TireType;
  season?: string | null;
  price: number;
  promoPrice?: number | null;
  isPromo?: boolean;
  stockQty: number;
  minStock?: number;
  sku?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  compatibleMakes?: string[];
  compatibleModels?: string[];
  isActive?: boolean;
}

function parseSize(size: string): {
  width: number | null;
  aspectRatio: number | null;
  rimDiameter: number | null;
} {
  // 205/55R16 or 205/55R16 91V
  const m = size.toUpperCase().match(/(\d{3})\s*\/\s*(\d{2})\s*R\s*(\d{2})/);
  if (!m) return { width: null, aspectRatio: null, rimDiameter: null };
  return {
    width: Number(m[1]),
    aspectRatio: Number(m[2]),
    rimDiameter: Number(m[3]),
  };
}

function matchesCar(tire: TireRecord, carQuery: string): boolean {
  const q = carQuery.toLowerCase().trim();
  if (!q) return true;
  const hay = [
    ...tire.compatibleMakes,
    ...tire.compatibleModels,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q) || q.split(/\s+/).every((part) => hay.includes(part));
}

export async function listTires(
  tenantId: string,
  filters: TireFilters = {}
): Promise<TireRecord[]> {
  const store = getDemoStore();
  let items = store.tires.filter((t) => t.tenantId === tenantId);

  if (filters.activeOnly !== false) {
    items = items.filter((t) => t.isActive);
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    items = items.filter(
      (t) =>
        t.brand.toLowerCase().includes(q) ||
        t.model.toLowerCase().includes(q) ||
        t.size.toLowerCase().includes(q) ||
        (t.sku?.toLowerCase().includes(q) ?? false) ||
        (t.description?.toLowerCase().includes(q) ?? false)
    );
  }
  if (filters.carModel?.trim()) {
    items = items.filter((t) => matchesCar(t, filters.carModel!));
  }
  if (filters.type && filters.type !== "TODOS") {
    items = items.filter((t) => t.type === filters.type);
  }
  if (filters.size?.trim()) {
    const s = filters.size.trim().toUpperCase().replace(/\s+/g, "");
    items = items.filter((t) =>
      t.size.toUpperCase().replace(/\s+/g, "").includes(s)
    );
  }
  if (filters.brands?.length) {
    const set = new Set(filters.brands.map((b) => b.toLowerCase()));
    items = items.filter((t) => set.has(t.brand.toLowerCase()));
  }
  if (filters.priceMin != null) {
    items = items.filter((t) => effectivePrice(t) >= filters.priceMin!);
  }
  if (filters.priceMax != null) {
    items = items.filter((t) => effectivePrice(t) <= filters.priceMax!);
  }
  if (filters.promoOnly) {
    items = items.filter((t) => t.isPromo && t.promoPrice != null);
  }
  if (filters.inStockOnly) {
    items = items.filter((t) => t.stockQty > 0);
  }

  return items.sort((a, b) => {
    if (a.isPromo !== b.isPromo) return a.isPromo ? -1 : 1;
    return a.brand.localeCompare(b.brand) || a.size.localeCompare(b.size);
  });
}

export function effectivePrice(t: TireRecord): number {
  return t.isPromo && t.promoPrice != null ? t.promoPrice : t.price;
}

export async function getTireById(
  tenantId: string,
  id: string
): Promise<TireRecord | null> {
  return (
    getDemoStore().tires.find(
      (t) => t.id === id && t.tenantId === tenantId
    ) ?? null
  );
}

export async function getTireBrands(tenantId: string): Promise<string[]> {
  const brands = new Set(
    getDemoStore()
      .tires.filter((t) => t.tenantId === tenantId && t.isActive)
      .map((t) => t.brand)
  );
  return [...brands].sort();
}

export async function getTireSizes(tenantId: string): Promise<string[]> {
  const sizes = new Set(
    getDemoStore()
      .tires.filter((t) => t.tenantId === tenantId && t.isActive)
      .map((t) => t.size)
  );
  return [...sizes].sort();
}

export async function getPriceRange(
  tenantId: string
): Promise<{ min: number; max: number }> {
  const items = getDemoStore().tires.filter(
    (t) => t.tenantId === tenantId && t.isActive
  );
  if (!items.length) return { min: 0, max: 2000 };
  const prices = items.map(effectivePrice);
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

export async function createTire(
  tenantId: string,
  input: TireFormInput
): Promise<TireRecord> {
  const store = getDemoStore();
  const parsed = parseSize(input.size);
  const ts = new Date().toISOString();
  const record: TireRecord = {
    id: newId(),
    tenantId,
    brand: input.brand.trim(),
    model: input.model.trim(),
    size: input.size.trim().toUpperCase(),
    width: input.width ?? parsed.width,
    aspectRatio: input.aspectRatio ?? parsed.aspectRatio,
    rimDiameter: input.rimDiameter ?? parsed.rimDiameter,
    loadIndex: input.loadIndex?.trim() || null,
    speedRating: input.speedRating?.trim() || null,
    type: input.type,
    season: input.season?.trim() || null,
    price: input.price,
    promoPrice: input.promoPrice ?? null,
    isPromo: !!input.isPromo && input.promoPrice != null,
    stockQty: input.stockQty,
    minStock: input.minStock ?? 2,
    sku: input.sku?.trim() || null,
    description: input.description?.trim() || null,
    imageUrl: input.imageUrl || null,
    imageUrls: input.imageUrls ?? (input.imageUrl ? [input.imageUrl] : []),
    compatibleMakes: input.compatibleMakes ?? [],
    compatibleModels: input.compatibleModels ?? [],
    isActive: input.isActive !== false,
    createdAt: ts,
    updatedAt: ts,
  };
  store.tires.unshift(record);
  return record;
}

export async function updateTire(
  tenantId: string,
  id: string,
  input: Partial<TireFormInput>
): Promise<TireRecord | null> {
  const store = getDemoStore();
  const idx = store.tires.findIndex(
    (t) => t.id === id && t.tenantId === tenantId
  );
  if (idx < 0) return null;
  const prev = store.tires[idx];
  const size = input.size?.trim().toUpperCase() ?? prev.size;
  const parsed = parseSize(size);
  store.tires[idx] = {
    ...prev,
    brand: input.brand?.trim() ?? prev.brand,
    model: input.model?.trim() ?? prev.model,
    size,
    width: input.width !== undefined ? input.width : prev.width ?? parsed.width,
    aspectRatio:
      input.aspectRatio !== undefined
        ? input.aspectRatio
        : prev.aspectRatio ?? parsed.aspectRatio,
    rimDiameter:
      input.rimDiameter !== undefined
        ? input.rimDiameter
        : prev.rimDiameter ?? parsed.rimDiameter,
    loadIndex:
      input.loadIndex !== undefined
        ? input.loadIndex?.trim() || null
        : prev.loadIndex,
    speedRating:
      input.speedRating !== undefined
        ? input.speedRating?.trim() || null
        : prev.speedRating,
    type: input.type ?? prev.type,
    season:
      input.season !== undefined ? input.season?.trim() || null : prev.season,
    price: input.price ?? prev.price,
    promoPrice:
      input.promoPrice !== undefined ? input.promoPrice : prev.promoPrice,
    isPromo:
      input.isPromo !== undefined
        ? input.isPromo
        : prev.isPromo,
    stockQty: input.stockQty ?? prev.stockQty,
    minStock: input.minStock ?? prev.minStock,
    sku: input.sku !== undefined ? input.sku?.trim() || null : prev.sku,
    description:
      input.description !== undefined
        ? input.description?.trim() || null
        : prev.description,
    imageUrl:
      input.imageUrl !== undefined ? input.imageUrl : prev.imageUrl,
    imageUrls: input.imageUrls ?? prev.imageUrls,
    compatibleMakes: input.compatibleMakes ?? prev.compatibleMakes,
    compatibleModels: input.compatibleModels ?? prev.compatibleModels,
    isActive: input.isActive ?? prev.isActive,
    updatedAt: new Date().toISOString(),
  };
  return store.tires[idx];
}

export async function adjustTireStock(
  tenantId: string,
  id: string,
  delta: number
): Promise<TireRecord | null> {
  const store = getDemoStore();
  const idx = store.tires.findIndex(
    (t) => t.id === id && t.tenantId === tenantId
  );
  if (idx < 0) return null;
  const next = Math.max(0, store.tires[idx].stockQty + delta);
  store.tires[idx] = {
    ...store.tires[idx],
    stockQty: next,
    updatedAt: new Date().toISOString(),
  };
  return store.tires[idx];
}

export async function deleteTire(
  tenantId: string,
  id: string
): Promise<boolean> {
  const store = getDemoStore();
  const idx = store.tires.findIndex(
    (t) => t.id === id && t.tenantId === tenantId
  );
  if (idx < 0) return false;
  store.tires[idx] = {
    ...store.tires[idx],
    isActive: false,
    updatedAt: new Date().toISOString(),
  };
  return true;
}

export async function createTireInterest(params: {
  tenantId: string;
  tireId: string;
  quantity: number;
  type: TireInterestType;
  clientName?: string | null;
  clientPhone?: string | null;
  notes?: string | null;
}): Promise<TireInterestRecord> {
  const store = getDemoStore();
  const tire = store.tires.find(
    (t) => t.id === params.tireId && t.tenantId === params.tenantId
  );
  if (!tire) throw new Error("Pneu não encontrado");
  if (params.quantity < 1) throw new Error("Quantidade inválida");

  const rec: TireInterestRecord = {
    id: newId(),
    tenantId: params.tenantId,
    tireId: params.tireId,
    quantity: params.quantity,
    type: params.type,
    clientName: params.clientName?.trim() || null,
    clientPhone: params.clientPhone?.trim() || null,
    notes: params.notes?.trim() || null,
    status: "NOVO",
    createdAt: new Date().toISOString(),
  };
  store.tireInterests.unshift(rec);

  store.notifications.unshift({
    id: newId(),
    tenantId: params.tenantId,
    userId: null,
    title:
      params.type === "COMPRA"
        ? "Pedido de pneu (Comprar)"
        : "Solicitação de orçamento (pneu)",
    body: `${params.quantity}x ${tire.brand} ${tire.model} ${tire.size}`,
    href: "/pneus",
    read: false,
    createdAt: new Date().toISOString(),
  });

  return rec;
}

/** AI / catalog search helper */
export async function searchTiresForAgent(
  tenantId: string,
  params: {
    medida?: string;
    marca?: string;
    modelo_carro?: string;
    preco_max?: number;
    tipo?: string;
  }
): Promise<TireRecord[]> {
  return listTires(tenantId, {
    size: params.medida,
    brands: params.marca ? [params.marca] : undefined,
    carModel: params.modelo_carro,
    priceMax: params.preco_max,
    type: (params.tipo as TireType) || "TODOS",
    activeOnly: true,
  });
}

export async function checkCompatibility(
  tenantId: string,
  tireId: string,
  vehicleQuery: string
): Promise<{ compatible: boolean; tire: TireRecord | null; reason: string }> {
  const tire = await getTireById(tenantId, tireId);
  if (!tire) {
    return { compatible: false, tire: null, reason: "Pneu não encontrado" };
  }
  const ok = matchesCar(tire, vehicleQuery);
  return {
    compatible: ok,
    tire,
    reason: ok
      ? `Compatível com ${vehicleQuery}`
      : `Não há registro de compatibilidade de ${tire.brand} ${tire.size} com "${vehicleQuery}". Confirme na ficha técnica do veículo.`,
  };
}
