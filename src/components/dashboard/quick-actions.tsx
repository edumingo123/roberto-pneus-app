import Link from "next/link";
import {
  Plus,
  CalendarPlus,
  UserPlus,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface QuickAction {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  className?: string;
}

const actions: QuickAction[] = [
  {
    title: "Nova OS",
    href: "/ordens-servico/nova",
    icon: Wrench,
    roles: ["ADMIN", "RECEPCIONISTA", "MECANICO"],
    className: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  {
    title: "Agendar",
    href: "/agendamentos/novo",
    icon: CalendarPlus,
    roles: ["ADMIN", "RECEPCIONISTA"],
    className: "bg-brand-orange text-white hover:bg-brand-orange/90",
  },
  {
    title: "Novo cliente",
    href: "/clientes/novo",
    icon: UserPlus,
    roles: ["ADMIN", "RECEPCIONISTA"],
    className:
      "bg-card text-foreground border border-border hover:bg-muted",
  },
  {
    title: "Pneus",
    href: "/pneus",
    icon: Plus,
    roles: ["ADMIN", "MECANICO", "RECEPCIONISTA"],
    className:
      "bg-card text-foreground border border-border hover:bg-muted",
  },
];

export function QuickActions({ role }: { role: UserRole }) {
  const visible = actions.filter((a) => a.roles.includes(role));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {visible.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href + action.title}
            href={action.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-4 min-h-14 font-semibold text-sm md:text-base shadow-sm transition-all active:scale-[0.98] tap-target",
              action.className
            )}
          >
            <Icon className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
            <span>{action.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
