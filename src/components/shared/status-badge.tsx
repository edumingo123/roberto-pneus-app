import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({
  active,
  activeLabel = "Ativo",
  inactiveLabel = "Inativo",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-lg font-medium",
        active
          ? "bg-success/15 text-success border-0"
          : "bg-muted text-muted-foreground border-0"
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}
