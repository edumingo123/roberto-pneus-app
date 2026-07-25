import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceOrderByPublicToken } from "@/lib/data/service-orders";
import { PublicTracking } from "@/components/service-orders/public-tracking";

export const metadata: Metadata = {
  title: "Acompanhamento da OS",
};

export default async function PublicOsTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getServiceOrderByPublicToken(token);
  if (!order) notFound();

  return <PublicTracking order={order} />;
}
