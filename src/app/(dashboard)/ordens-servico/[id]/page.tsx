import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { getServiceOrderById } from "@/lib/data/service-orders";
import { listMechanicOptions } from "@/lib/data/appointments";
import { OsDetailView } from "@/components/service-orders/os-detail";

export const metadata: Metadata = { title: "Detalhe da OS" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function OsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveSession();
  const order = await getServiceOrderById(session.user.tenantId, id);
  if (!order) notFound();

  const mechanics = await listMechanicOptions(session.user.tenantId);
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return (
    <div className="space-y-4">
      <Link
        href="/ordens-servico"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Ordens de serviço
      </Link>
      <OsDetailView
        order={order}
        mechanics={mechanics}
        workshopName={session.tenant.name}
        publicBaseUrl={publicBaseUrl}
      />
    </div>
  );
}
