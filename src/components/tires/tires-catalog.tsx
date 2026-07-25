"use client";

import { useMemo, useState } from "react";
import { Filter, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TireRecord } from "@/lib/data/types";
import { TireCard } from "./tire-card";
import { TireFilters, type TireFilterState } from "./tire-filters";
import { TireDetailModal } from "./tire-detail-modal";
import { TireFormDialog } from "./tire-form-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { effectivePrice } from "@/lib/data/tires";
import { deleteTireAction } from "@/lib/actions/tires";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  initialTires: TireRecord[];
  brands: string[];
  sizes: string[];
  priceBounds: { min: number; max: number };
  canManage: boolean;
}

export function TiresCatalog({
  initialTires,
  brands,
  sizes,
  priceBounds,
  canManage,
}: Props) {
  const [tires, setTires] = useState(initialTires);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<TireFilterState>({
    q: "",
    carModel: "",
    type: "TODOS",
    size: "",
    brands: [],
    priceMin: priceBounds.min,
    priceMax: priceBounds.max,
    promoOnly: false,
  });
  const [selected, setSelected] = useState<TireRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTire, setEditTire] = useState<TireRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TireRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return tires.filter((t) => {
      if (!t.isActive) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (
          !t.brand.toLowerCase().includes(q) &&
          !t.model.toLowerCase().includes(q) &&
          !t.size.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (filters.carModel) {
        const q = filters.carModel.toLowerCase();
        const hay = [...t.compatibleMakes, ...t.compatibleModels]
          .join(" ")
          .toLowerCase();
        if (!q.split(/\s+/).every((p) => hay.includes(p))) return false;
      }
      if (filters.type !== "TODOS" && t.type !== filters.type) return false;
      if (
        filters.size &&
        !t.size.toUpperCase().includes(filters.size.toUpperCase())
      ) {
        return false;
      }
      if (filters.brands.length && !filters.brands.includes(t.brand)) {
        return false;
      }
      const p = effectivePrice(t);
      if (p < filters.priceMin || p > filters.priceMax) return false;
      if (filters.promoOnly && !t.isPromo) return false;
      return true;
    });
  }, [tires, filters]);

  function openDetail(t: TireRecord) {
    setSelected(t);
    setDetailOpen(true);
  }

  function openEdit(t: TireRecord) {
    setEditTire(t);
    setFormOpen(true);
  }

  function openCreate() {
    setEditTire(null);
    setFormOpen(true);
  }

  function isCompatible(t: TireRecord): boolean {
    if (!filters.carModel.trim()) return false;
    const hay = [...t.compatibleModels, ...t.compatibleMakes]
      .join(" ")
      .toLowerCase();
    return filters.carModel
      .toLowerCase()
      .split(/\s+/)
      .every((p) => hay.includes(p));
  }

  function handleSaved(tire: TireRecord) {
    setTires((list) => {
      const exists = list.some((x) => x.id === tire.id);
      if (exists) {
        return list.map((x) => (x.id === tire.id ? tire : x));
      }
      return [tire, ...list];
    });
    // Keep detail modal in sync if open
    if (selected?.id === tire.id) {
      setSelected(tire);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteTireAction(deleteTarget.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setTires((list) =>
        list.map((t) =>
          t.id === deleteTarget.id ? { ...t, isActive: false } : t
        )
      );
      if (selected?.id === deleteTarget.id) {
        setDetailOpen(false);
        setSelected(null);
      }
      toast.success(res.message ?? "Pneu excluído");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Catálogo de Pneus</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} produto(s)
            {filters.carModel ? ` · filtro: “${filters.carModel}”` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="lg:hidden h-10 rounded-xl"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filtros
          </Button>
          {canManage ? (
            <Button
              className="h-10 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo pneu
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex gap-4 items-start">
        <TireFilters
          value={filters}
          onChange={setFilters}
          brands={brands}
          sizes={sizes}
          priceBounds={priceBounds}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          hideMobileButton
        />

        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum pneu encontrado"
              description="Ajuste os filtros ou cadastre novos produtos."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4">
              {filtered.map((t) => (
                <TireCard
                  key={t.id}
                  tire={t}
                  compatible={isCompatible(t)}
                  canManage={canManage}
                  onClick={() => openDetail(t)}
                  onEdit={() => openEdit(t)}
                  onDelete={() => setDeleteTarget(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TireDetailModal
        tire={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canManage={canManage}
        onUpdated={(t) => {
          setTires((list) => list.map((x) => (x.id === t.id ? t : x)));
          setSelected(t);
        }}
        onEdit={
          canManage && selected
            ? () => {
                setDetailOpen(false);
                openEdit(selected);
              }
            : undefined
        }
        onDelete={
          canManage && selected
            ? () => {
                setDetailOpen(false);
                setDeleteTarget(selected);
              }
            : undefined
        }
      />

      <TireFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditTire(null);
        }}
        initial={editTire}
        onSaved={handleSaved}
      />

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl" showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Excluir pneu?</DialogTitle>
            <DialogDescription>
              O pneu{" "}
              <strong className="text-foreground">
                {deleteTarget?.brand} {deleteTarget?.model}{" "}
                {deleteTarget?.size}
              </strong>{" "}
              será removido do catálogo. Esta ação pode ser revertida apenas
              reativando o cadastro no banco.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 rounded-xl"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
