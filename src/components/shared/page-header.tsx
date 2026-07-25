import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel = "Novo",
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {children}
        {actionHref ? (
          <Link
            href={actionHref}
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-10 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold px-4"
            )}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
