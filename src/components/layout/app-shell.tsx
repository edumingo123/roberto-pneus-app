"use client";

import type { SessionUser, TenantInfo } from "@/types";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";

interface AppShellProps {
  user: SessionUser;
  tenant: TenantInfo;
  title?: string;
  children: React.ReactNode;
}

export function AppShell({ user, tenant, title, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} tenant={tenant} />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header user={user} tenant={tenant} title={title} />

        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-nav md:pb-6 min-h-0">
          {children}
        </main>
      </div>

      <MobileNav role={user.role} />
    </div>
  );
}
