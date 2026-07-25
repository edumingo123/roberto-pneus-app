import type { NavItem, UserRole } from "@/types";

export const APP_NAME = "Roberto Pneus";
export const APP_DESCRIPTION =
  "Gestão de oficina mecânica e centro automotivo — multi-tenant SaaS";

/** Navigation items filtered by role in the layout */
export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["ADMIN", "MECANICO", "RECEPCIONISTA"],
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: "Users",
    roles: ["ADMIN", "RECEPCIONISTA", "MECANICO"],
  },
  {
    title: "Veículos",
    href: "/veiculos",
    icon: "Car",
    roles: ["ADMIN", "RECEPCIONISTA", "MECANICO"],
  },
  {
    title: "Agendamentos",
    href: "/agendamentos",
    icon: "Calendar",
    roles: ["ADMIN", "RECEPCIONISTA", "MECANICO"],
  },
  {
    title: "Ordens de Serviço",
    href: "/ordens-servico",
    icon: "Wrench",
    roles: ["ADMIN", "RECEPCIONISTA", "MECANICO"],
  },
  {
    title: "Pneus",
    href: "/pneus",
    icon: "CircleDot",
    roles: ["ADMIN", "RECEPCIONISTA", "MECANICO"],
  },
  {
    title: "Chat",
    href: "/chat",
    icon: "MessageCircle",
    roles: ["ADMIN", "MECANICO", "RECEPCIONISTA"],
  },
  {
    title: "Agente IA",
    href: "/agente-ia",
    icon: "MessageCircle",
    roles: ["ADMIN", "RECEPCIONISTA"],
  },
  {
    title: "Manutenção",
    href: "/manutencao",
    icon: "ClipboardList",
    roles: ["ADMIN", "RECEPCIONISTA", "MECANICO"],
  },
  {
    title: "Tipos de Manutenção",
    href: "/tipos-manutencao",
    icon: "ClipboardList",
    roles: ["ADMIN", "RECEPCIONISTA"],
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: "Users",
    roles: ["ADMIN"],
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: "Settings",
    roles: ["ADMIN"],
  },
];

/** Mobile bottom nav — short labels, thumb-friendly */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  {
    title: "Início",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["ADMIN", "MECANICO", "RECEPCIONISTA"],
  },
  {
    title: "OS",
    href: "/ordens-servico",
    icon: "Wrench",
    roles: ["ADMIN", "MECANICO", "RECEPCIONISTA"],
  },
  {
    title: "Pneus",
    href: "/pneus",
    icon: "CircleDot",
    roles: ["ADMIN", "RECEPCIONISTA", "MECANICO"],
  },
  {
    title: "Chat",
    href: "/chat",
    icon: "MessageCircle",
    roles: ["ADMIN", "MECANICO", "RECEPCIONISTA"],
  },
  {
    title: "Mais",
    href: "/mais",
    icon: "Menu",
    roles: ["ADMIN", "MECANICO", "RECEPCIONISTA"],
  },
];

export function filterNavByRole(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}

export const PUBLIC_ROUTES = [
  "/login",
  "/auth/callback",
  "/acompanhamento",
  "/api/webhooks",
];

export const AUTH_ROUTES = ["/login"];
