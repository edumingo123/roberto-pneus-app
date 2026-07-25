"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  FileText,
  ImageIcon,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type {
  VehicleDocumentRecord,
  VehicleWithClient,
} from "@/lib/data/types";
import { formatKm, formatPlate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  deleteVehicleDocumentAction,
  uploadVehicleDocumentAction,
} from "@/lib/actions/vehicles";
import { FUEL_OPTIONS, TRANSMISSION_OPTIONS } from "@/lib/constants/brazil";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function VehicleDetailView({
  vehicle,
}: {
  vehicle: VehicleWithClient;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [docToDelete, setDocToDelete] =
    useState<VehicleDocumentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fuelLabel =
    FUEL_OPTIONS.find((f) => f.value === vehicle.fuel)?.label ?? "—";
  const transLabel =
    TRANSMISSION_OPTIONS.find((t) => t.value === vehicle.transmission)
      ?.label ?? "—";

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("vehicleId", vehicle.id);
      fd.set("file", file);
      const res = await uploadVehicleDocumentAction(fd);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Arquivo enviado");
      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function confirmDelete() {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteVehicleDocumentAction(docToDelete.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Arquivo excluído com sucesso");
      setDocToDelete(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-wide">
            {formatPlate(vehicle.plate)}
          </h2>
          <p className="text-muted-foreground">
            {vehicle.brand} {vehicle.model} · {vehicle.yearModel}
          </p>
          <p className="text-sm font-medium text-brand-orange mt-1">
            {formatKm(vehicle.currentKm)}
          </p>
        </div>
        <Link
          href={`/veiculos/${vehicle.id}/editar`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10 rounded-xl"
          )}
        >
          <Pencil className="h-4 w-4 mr-1.5" />
          Editar
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dados do veículo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Cor" value={vehicle.color} />
            <Info label="Ano fab." value={String(vehicle.yearManufacture)} />
            <Info label="Combustível" value={fuelLabel} />
            <Info label="Câmbio" value={transLabel} />
            <Info label="Motor" value={vehicle.engine ?? "—"} />
            <Info label="Potência" value={vehicle.power ?? "—"} />
            <Info label="Cód. motor" value={vehicle.engineCode ?? "—"} />
            <Info label="Chassi" value={vehicle.chassis ?? "—"} />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Proprietário
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <Link
              href={`/clientes/${vehicle.clientId}`}
              className="font-semibold text-primary hover:underline"
            >
              {vehicle.client.name}
            </Link>
            <p className="text-muted-foreground">{vehicle.client.whatsapp}</p>
            {vehicle.notes ? (
              <p className="pt-2 border-t text-muted-foreground">
                {vehicle.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base">Fotos e documentos</CardTitle>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
            <Button
              type="button"
              className="h-9 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!vehicle.documents?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum arquivo. Envie fotos ou PDFs (máx. 5MB).
            </p>
          ) : (
            <ul className="space-y-2">
              {vehicle.documents.map((d) => {
                const isImage = d.fileType.startsWith("image/");
                return (
                  <li
                    key={d.id}
                    className="flex items-center gap-2 rounded-xl border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.fileUrl}
                          alt={d.name}
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                          {d.fileType === "application/pdf" ? (
                            <FileText className="h-5 w-5" />
                          ) : (
                            <ImageIcon className="h-5 w-5" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.fileType}
                          {d.sizeBytes
                            ? ` · ${(d.sizeBytes / 1024).toFixed(0)} KB`
                            : ""}
                        </p>
                      </div>
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Excluir arquivo"
                      aria-label={`Excluir ${d.name}`}
                      onClick={() => setDocToDelete(d)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!docToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setDocToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl" showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Excluir arquivo?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O arquivo{" "}
              <strong className="text-foreground">
                {docToDelete?.name}
              </strong>{" "}
              será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              disabled={deleting}
              onClick={() => setDocToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 rounded-xl"
              disabled={deleting}
              onClick={confirmDelete}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-medium break-all">{value}</p>
    </div>
  );
}
