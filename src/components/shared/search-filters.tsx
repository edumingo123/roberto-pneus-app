"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  placeholder?: string;
  statusOptions?: { value: string; label: string }[];
  statusParam?: string;
  className?: string;
}

export function SearchFilters({
  placeholder = "Buscar...",
  statusOptions,
  statusParam = "status",
  className,
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "TODOS") params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: q.trim() || undefined });
  }

  const currentStatus = searchParams.get(statusParam) ?? "TODOS";

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <form onSubmit={onSubmit} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="pl-9 h-11 rounded-xl bg-card"
        />
      </form>
      {statusOptions ? (
        <select
          value={currentStatus}
          onChange={(e) => updateParams({ [statusParam]: e.target.value })}
          className="h-11 rounded-xl border border-input bg-card px-3 text-sm min-w-[140px]"
          disabled={isPending}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
