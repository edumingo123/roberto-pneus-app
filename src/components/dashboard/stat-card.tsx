import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  accent?: "primary" | "orange" | "success" | "warning";
}

const accentStyles = {
  primary: "bg-primary/10 text-primary",
  orange: "bg-brand-orange/10 text-brand-orange",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  accent = "primary",
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border-border shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
            {trend ? (
              <p className="text-xs text-success font-medium">{trend}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              accentStyles[accent]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
