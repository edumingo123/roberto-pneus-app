import type { ServiceOrderStatus } from "@/lib/data/types";
import { OS_STATUS_COLORS, osStatusLabel } from "@/lib/service-orders/status";
import { Badge } from "@/components/ui/badge";

export function OsStatusBadge({ status }: { status: ServiceOrderStatus }) {
  return (
    <Badge
      className="rounded-lg border-0 text-white font-medium"
      style={{ backgroundColor: OS_STATUS_COLORS[status] }}
    >
      {osStatusLabel(status)}
    </Badge>
  );
}
