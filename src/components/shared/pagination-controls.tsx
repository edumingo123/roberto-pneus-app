import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}

export function PaginationControls({
  page,
  totalPages,
  total,
  basePath,
  searchParams = {},
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        {total} registro{total === 1 ? "" : "s"}
      </p>
    );
  }

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "page") params.set(k, v);
    });
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages} · {total} registro{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "rounded-lg",
            page <= 1 && "pointer-events-none opacity-40"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "rounded-lg",
            page >= totalPages && "pointer-events-none opacity-40"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
