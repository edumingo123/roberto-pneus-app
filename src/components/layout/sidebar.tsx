"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { filterNavByRole, NAV_ITEMS, APP_NAME } from "@/lib/constants";
import type { SessionUser, TenantInfo } from "@/types";
import { ROLE_LABELS } from "@/types";
import { NavIcon } from "./nav-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  user: SessionUser;
  tenant: TenantInfo;
}

export function Sidebar({ user, tenant }: SidebarProps) {
  const pathname = usePathname();
  const items = filterNavByRole(NAV_ITEMS, user.role);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm shadow-sm">
          RP
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate leading-tight">
            {tenant.name || APP_NAME}
          </p>
          <p className="text-[11px] text-sidebar-foreground/60 truncate">
            Centro Automotivo
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-[11px] text-sidebar-foreground/60 truncate">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </div>
        <Separator className="my-2 bg-sidebar-border" />
        <p className="px-2 text-[10px] text-sidebar-foreground/40">
          Multi-tenant · Fase 1
        </p>
      </div>
    </aside>
  );
}
