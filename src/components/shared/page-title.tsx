import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageTitleProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent page header with optional breadcrumbs for dashboard screens.
 */
export function PageTitle({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageTitleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((item, i) => (
              <span key={item.label + i} className="inline-flex items-center gap-1">
                {i > 0 ? (
                  <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
                ) : null}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground/80 font-medium">
                    {item.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h2 className="text-xl md:text-2xl font-bold tracking-tight truncate">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
