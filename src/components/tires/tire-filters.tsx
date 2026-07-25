"use client";

import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TireFilterState {
  q: string;
  carModel: string;
  type: string;
  size: string;
  brands: string[];
  priceMin: number;
  priceMax: number;
  promoOnly: boolean;
}

const TIRE_TYPES = [
  { value: "TODOS", label: "Todos os tipos" },
  { value: "PASSEIO", label: "Passeio" },
  { value: "SUV", label: "SUV" },
  { value: "CAMINHONETE", label: "Caminhonete" },
  { value: "COMERCIAL", label: "Carga" },
  { value: "MOTO", label: "Moto" },
  { value: "OFF_ROAD", label: "Off-road" },
  { value: "CORRIDA", label: "Corrida" },
];

interface Props {
  value: TireFilterState;
  onChange: (next: TireFilterState) => void;
  brands: string[];
  sizes: string[];
  priceBounds: { min: number; max: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, parent renders its own mobile filter button */
  hideMobileButton?: boolean;
}

export function TireFilters({
  value,
  onChange,
  brands,
  sizes,
  priceBounds,
  open,
  onOpenChange,
  hideMobileButton,
}: Props) {
  function patch(p: Partial<TireFilterState>) {
    onChange({ ...value, ...p });
  }

  function toggleBrand(b: string) {
    const set = new Set(value.brands);
    if (set.has(b)) set.delete(b);
    else set.add(b);
    patch({ brands: [...set] });
  }

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between lg:hidden">
        <p className="font-semibold">Filtros</p>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Buscar
        </label>
        <Input
          className="h-10 rounded-xl mt-1"
          placeholder="Marca, modelo, medida..."
          value={value.q}
          onChange={(e) => patch({ q: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Modelo de carro
        </label>
        <Input
          className="h-10 rounded-xl mt-1"
          placeholder="Ex: Honda Civic 2020"
          value={value.carModel}
          onChange={(e) => patch({ carModel: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Tipo
        </label>
        <select
          className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={value.type}
          onChange={(e) => patch({ type: e.target.value })}
        >
          {TIRE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Medida
        </label>
        <select
          className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={value.size}
          onChange={(e) => patch({ size: e.target.value })}
        >
          <option value="">Todas</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Marcas
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {brands.map((b) => {
            const active = value.brands.includes(b);
            return (
              <button
                key={b}
                type="button"
                onClick={() => toggleBrand(b)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs border font-medium",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-muted"
                )}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Preço: R$ {value.priceMin} – R$ {value.priceMax}
        </label>
        <div className="mt-2 space-y-2">
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            value={value.priceMin}
            onChange={(e) =>
              patch({
                priceMin: Math.min(Number(e.target.value), value.priceMax),
              })
            }
            className="w-full accent-brand-orange"
          />
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            value={value.priceMax}
            onChange={(e) =>
              patch({
                priceMax: Math.max(Number(e.target.value), value.priceMin),
              })
            }
            className="w-full accent-primary"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          className="size-4 rounded accent-brand-orange"
          checked={value.promoOnly}
          onChange={(e) => patch({ promoOnly: e.target.checked })}
        />
        Em promoção
      </label>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl"
        onClick={() =>
          onChange({
            q: "",
            carModel: "",
            type: "TODOS",
            size: "",
            brands: [],
            priceMin: priceBounds.min,
            priceMax: priceBounds.max,
            promoOnly: false,
          })
        }
      >
        Limpar filtros
      </Button>
    </div>
  );

  return (
    <>
      {!hideMobileButton ? (
        <Button
          type="button"
          variant="outline"
          className="lg:hidden h-10 rounded-xl"
          onClick={() => onOpenChange(true)}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Filtros
        </Button>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="rounded-xl border bg-card p-4 shadow-sm sticky top-20">
          {content}
        </div>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar filtros"
            onClick={() => onOpenChange(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(20rem,90vw)] bg-card p-4 shadow-xl overflow-y-auto">
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
