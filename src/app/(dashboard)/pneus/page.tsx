import type { Metadata } from "next";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import {
  getPriceRange,
  getTireBrands,
  getTireSizes,
  listTires,
} from "@/lib/data/tires";
import { TiresCatalog } from "@/components/tires/tires-catalog";

export const metadata: Metadata = { title: "Pneus" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function PneusPage() {
  const session = await resolveSession();
  const tenantId = session.user.tenantId;
  const [tires, brands, sizes, priceBounds] = await Promise.all([
    listTires(tenantId, { activeOnly: false }),
    getTireBrands(tenantId),
    getTireSizes(tenantId),
    getPriceRange(tenantId),
  ]);

  const canManage =
    session.user.role === "ADMIN" || session.user.role === "RECEPCIONISTA";

  return (
    <TiresCatalog
      initialTires={tires}
      brands={brands}
      sizes={sizes}
      priceBounds={priceBounds}
      canManage={canManage}
    />
  );
}
