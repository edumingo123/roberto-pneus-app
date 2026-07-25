import type { Metadata } from "next";
import Link from "next/link";
import { filterNavByRole, NAV_ITEMS } from "@/lib/constants";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { NavIcon } from "@/components/layout/nav-icons";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/shared/page-title";

export const metadata: Metadata = { title: "Mais" };

export default async function MaisPage() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();

  // Items not already on bottom nav
  const bottomHrefs = new Set([
    "/dashboard",
    "/ordens-servico",
    "/pneus",
    "/chat",
    "/mais",
  ]);
  const items = filterNavByRole(NAV_ITEMS, session.user.role).filter(
    (i) => !bottomHrefs.has(i.href)
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Mais opções"
        description={`${session.tenant.name} · ${session.user.name}`}
        breadcrumbs={[
          { label: "Início", href: "/dashboard" },
          { label: "Mais" },
        ]}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="tap-target">
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow h-full active:scale-[0.98]">
              <CardContent className="flex flex-col items-center justify-center gap-2.5 p-5 text-center min-h-[7.5rem]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <NavIcon name={item.icon} className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold leading-tight">
                  {item.title}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
