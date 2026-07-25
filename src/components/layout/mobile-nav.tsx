"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { filterNavByRole, MOBILE_NAV_ITEMS } from "@/lib/constants";
import type { UserRole } from "@/types";
import { NavIcon } from "./nav-icons";

interface MobileNavProps {
  role: UserRole;
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const items = filterNavByRole(MOBILE_NAV_ITEMS, role);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-safe safe-area-bottom">
      <ul className="flex items-stretch justify-around h-16 px-1 max-w-lg mx-auto">
        {items.map((item) => {
          const active =
            item.href === "/mais"
              ? pathname === "/mais" ||
                pathname.startsWith("/configuracoes") ||
                pathname.startsWith("/usuarios") ||
                pathname.startsWith("/agendamentos") ||
                pathname.startsWith("/veiculos") ||
                pathname.startsWith("/manutencao") ||
                pathname.startsWith("/tipos-manutencao") ||
                pathname.startsWith("/agente-ia")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} className="flex-1 min-w-0">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-full rounded-xl text-[10px] font-semibold transition-colors min-h-[3rem]",
                  active
                    ? "text-brand-orange"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <NavIcon
                  name={item.icon}
                  className={cn("h-5 w-5 shrink-0", active && "stroke-[2.5]")}
                />
                <span className="truncate max-w-full px-0.5">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
