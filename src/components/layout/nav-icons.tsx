import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  CircleDot,
  MessageCircle,
  ClipboardList,
  Settings,
  Menu,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  CircleDot,
  MessageCircle,
  ClipboardList,
  Settings,
  Menu,
};

export function NavIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? LayoutDashboard;
  return <Icon className={className} aria-hidden />;
}
