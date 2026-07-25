"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import type { ServiceOrderDetail, ServiceOrderStatus } from "@/lib/data/types";
import {
  OS_TRANSITIONS,
  osStatusLabel,
  requiresExitKm,
} from "@/lib/service-orders/status";
import { formatKm, formatPlate, formatCpfCnpj, formatWhatsApp } from "@/lib/format";
import { OsStatusBadge } from "./os-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { selectClassName } from "@/components/shared/form-field";
import {
  deleteServiceOrderPhotoAction,
  saveServiceOrderLaborAction,
  saveServiceOrderPartsAction,
  sendBudgetWhatsAppAction,
  transitionServiceOrderAction,
  updateServiceOrderInfoAction,
  uploadServiceOrderPhotoAction,
} from "@/lib/actions/service-orders";
import { openOsConversationAction } from "@/lib/actions/chat";
import { OsPdfDownload } from "./os-pdf-download";

interface Props {
  order: ServiceOrderDetail;
  mechanics: { id: string; name: string }[];
  workshopName: string;
  publicBaseUrl: string;
}

type PartRow = {
  id?: string;
  description: string;
  brand: string;
  quantity: string;
  unitPrice: string;
};

type LaborRow = {
  id?: string;
  description: string;
  hours: string;
  hourlyRate: string;
};

export function OsDetailView({
  order,
  mechanics,
  workshopName,
  publicBaseUrl,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [kmExit, setKmExit] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoType, setPhotoType] = useState("ANTES");

  const [info, setInfo] = useState({
    mechanicId: order.mechanicId ?? "",
    complaint: order.complaint ?? "",
    diagnosis: order.diagnosis ?? "",
    internalNotes: order.internalNotes ?? "",
    discount: String(order.discount ?? 0),
  });

  const [parts, setParts] = useState<PartRow[]>(
    order.parts.length
      ? order.parts.map((p) => ({
          id: p.id,
          description: p.description,
          brand: p.brand ?? "",
          quantity: String(p.quantity),
          unitPrice: String(p.unitPrice),
        }))
      : [{ description: "", brand: "", quantity: "1", unitPrice: "0" }]
  );

  const [labor, setLabor] = useState<LaborRow[]>(
    order.laborItems.length
      ? order.laborItems.map((l) => ({
          id: l.id,
          description: l.description,
          hours: String(l.hours),
          hourlyRate: String(l.hourlyRate),
        }))
      : [{ description: "", hours: "1", hourlyRate: "100" }]
  );

  const partsSubtotal = useMemo(
    () =>
      parts.reduce(
        (s, p) => s + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
        0
      ),
    [parts]
  );
  const laborSubtotal = useMemo(
    () =>
      labor.reduce(
        (s, l) => s + (Number(l.hours) || 0) * (Number(l.hourlyRate) || 0),
        0
      ),
    [labor]
  );
  const discount = Number(info.discount) || 0;
  const grand = Math.max(0, partsSubtotal + laborSubtotal - discount);

  const publicUrl = `${publicBaseUrl}/acompanhamento/${order.publicToken}`;
  const nextStatuses = OS_TRANSITIONS[order.status] ?? [];

  async function saveInfo() {
    setLoading(true);
    try {
      const res = await updateServiceOrderInfoAction(order.id, info);
      if (!res.success) return toast.error(res.error);
      toast.success(res.message);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveParts() {
    setLoading(true);
    try {
      const res = await saveServiceOrderPartsAction(order.id, parts);
      if (!res.success) return toast.error(res.error);
      toast.success(res.message);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveLaborItems() {
    setLoading(true);
    try {
      const res = await saveServiceOrderLaborAction(order.id, labor);
      if (!res.success) return toast.error(res.error);
      toast.success(res.message);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function doTransition(toStatus: ServiceOrderStatus) {
    if (requiresExitKm(toStatus) && !kmExit) {
      toast.error("Informe a KM atual do veículo para entregar");
      return;
    }
    setLoading(true);
    try {
      const res = await transitionServiceOrderAction(order.id, {
        toStatus,
        notes: statusNotes,
        kmAtExit: kmExit || undefined,
      });
      if (!res.success) return toast.error(res.error);
      toast.success(res.message);
      setStatusNotes("");
      setKmExit("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function sendBudget() {
    setLoading(true);
    try {
      const res = await sendBudgetWhatsAppAction(order.id);
      if (!res.success) return toast.error(res.error);
      toast.success(res.message);
    } finally {
      setLoading(false);
    }
  }

  async function onPhoto(file?: File) {
    if (!file) return;
    if (!photoCaption.trim()) {
      toast.error("Informe a legenda da foto");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("serviceOrderId", order.id);
      fd.set("caption", photoCaption);
      fd.set("type", photoType);
      fd.set("file", file);
      const res = await uploadServiceOrderPhotoAction(fd);
      if (!res.success) return toast.error(res.error);
      toast.success(res.message);
      setPhotoCaption("");
      router.refresh();
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copiado");
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold">OS #{order.number}</h2>
            <OsStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {order.client.name} · {formatPlate(order.vehicle.plate)} ·{" "}
            {order.vehicle.brand} {order.vehicle.model}
          </p>
          <p className="text-sm font-medium text-brand-orange">
            Entrada: {formatKm(order.kmAtEntry)}
            {order.kmAtExit != null ? ` · Saída: ${formatKm(order.kmAtExit)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OsPdfDownload order={order} workshopName={workshopName} />
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={async () => {
              const res = await openOsConversationAction(order.id);
              if (!res.success) {
                toast.error(res.error);
                return;
              }
              router.push(`/chat?c=${res.data.conversationId}`);
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            Chat
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={copyLink}
          >
            <Copy className="h-4 w-4 mr-1.5" />
            Link
          </Button>
          <Link
            href={publicUrl}
            target="_blank"
            className="inline-flex items-center h-10 rounded-xl border px-3 text-sm hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4 mr-1.5" />
            Público
          </Link>
        </div>
      </div>

      {/* Quick actions mobile-first */}
      {nextStatuses.length > 0 ? (
        <Card className="rounded-xl shadow-sm border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">Ações rápidas</p>
            {requiresExitKm(nextStatuses[0]) ||
            nextStatuses.includes("ENTREGUE") ? (
              <Input
                type="number"
                min={0}
                placeholder="KM atual do veículo (obrigatória na entrega)"
                className="h-12 rounded-xl text-base"
                value={kmExit}
                onChange={(e) => setKmExit(e.target.value)}
              />
            ) : null}
            <Input
              placeholder="Observação da mudança (opcional)"
              className="h-10 rounded-xl"
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nextStatuses.map((s) => (
                <Button
                  key={s}
                  disabled={loading}
                  onClick={() => doTransition(s)}
                  className={
                    s === "CANCELADO"
                      ? "h-12 rounded-xl text-base font-semibold bg-destructive/90 hover:bg-destructive"
                      : "h-12 rounded-xl text-base font-semibold bg-brand-orange hover:bg-brand-orange/90 text-white"
                  }
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      {osStatusLabel(s)}
                    </>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl justify-start">
          {[
            ["info", "Informações"],
            ["diag", "Diagnóstico"],
            ["parts", "Peças"],
            ["labor", "Mão de Obra"],
            ["budget", "Orçamento"],
            ["timeline", "Acompanhamento"],
            ["photos", "Fotos"],
          ].map(([v, label]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-semibold">{order.client.name}</p>
                <p>{formatWhatsApp(order.client.whatsapp)}</p>
                <p className="font-mono text-xs">
                  {formatCpfCnpj(order.client.document)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Veículo</p>
                <p className="font-semibold tracking-wide">
                  {formatPlate(order.vehicle.plate)}
                </p>
                <p>
                  {order.vehicle.brand} {order.vehicle.model} ·{" "}
                  {order.vehicle.yearModel}
                </p>
                <p>{order.vehicle.color}</p>
              </div>
              <div className="sm:col-span-2 space-y-3 pt-2 border-t">
                <label className="text-sm font-medium">Mecânico</label>
                <select
                  className={selectClassName}
                  value={info.mechanicId}
                  onChange={(e) =>
                    setInfo((s) => ({ ...s, mechanicId: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <label className="text-sm font-medium">Desconto (R$)</label>
                <Input
                  className="h-10 rounded-xl"
                  value={info.discount}
                  onChange={(e) =>
                    setInfo((s) => ({ ...s, discount: e.target.value }))
                  }
                />
                <Button
                  onClick={saveInfo}
                  disabled={loading}
                  className="rounded-xl"
                >
                  Salvar informações
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Link e QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start gap-4">
              <div className="rounded-xl border p-3 bg-white">
                <QRCodeSVG value={publicUrl} size={120} />
              </div>
              <div className="text-sm break-all">
                <p className="text-muted-foreground mb-1">
                  Acompanhamento público
                </p>
                <p className="font-mono text-xs">{publicUrl}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diag" className="mt-4 space-y-3">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Problema relatado</label>
                <Textarea
                  className="mt-1 rounded-xl min-h-24"
                  value={info.complaint}
                  onChange={(e) =>
                    setInfo((s) => ({ ...s, complaint: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Diagnóstico técnico
                </label>
                <Textarea
                  className="mt-1 rounded-xl min-h-28"
                  value={info.diagnosis}
                  onChange={(e) =>
                    setInfo((s) => ({ ...s, diagnosis: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notas internas</label>
                <Textarea
                  className="mt-1 rounded-xl min-h-20"
                  value={info.internalNotes}
                  onChange={(e) =>
                    setInfo((s) => ({ ...s, internalNotes: e.target.value }))
                  }
                />
              </div>
              <Button onClick={saveInfo} disabled={loading} className="rounded-xl">
                Salvar diagnóstico
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="mt-4 space-y-3">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-3">
              {parts.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 md:grid-cols-12 gap-2 items-end border-b pb-3"
                >
                  <div className="col-span-2 md:col-span-4">
                    <label className="text-xs text-muted-foreground">
                      Descrição
                    </label>
                    <Input
                      className="h-10 rounded-xl"
                      value={row.description}
                      onChange={(e) => {
                        const next = [...parts];
                        next[i] = { ...row, description: e.target.value };
                        setParts(next);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">Marca</label>
                    <Input
                      className="h-10 rounded-xl"
                      value={row.brand}
                      onChange={(e) => {
                        const next = [...parts];
                        next[i] = { ...row, brand: e.target.value };
                        setParts(next);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Qtd</label>
                    <Input
                      type="number"
                      className="h-10 rounded-xl"
                      value={row.quantity}
                      onChange={(e) => {
                        const next = [...parts];
                        next[i] = { ...row, quantity: e.target.value };
                        setParts(next);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">
                      Preço un.
                    </label>
                    <Input
                      type="number"
                      className="h-10 rounded-xl"
                      value={row.unitPrice}
                      onChange={(e) => {
                        const next = [...parts];
                        next[i] = { ...row, unitPrice: e.target.value };
                        setParts(next);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      R${" "}
                      {(
                        (Number(row.quantity) || 0) *
                        (Number(row.unitPrice) || 0)
                      ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() =>
                        setParts(parts.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    setParts([
                      ...parts,
                      {
                        description: "",
                        brand: "",
                        quantity: "1",
                        unitPrice: "0",
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Linha
                </Button>
                <p className="font-bold">
                  Subtotal: R${" "}
                  {partsSubtotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <Button
                  onClick={saveParts}
                  disabled={loading}
                  className="rounded-xl bg-primary"
                >
                  Salvar peças
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labor" className="mt-4 space-y-3">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-3">
              {labor.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 md:grid-cols-12 gap-2 items-end border-b pb-3"
                >
                  <div className="col-span-2 md:col-span-5">
                    <label className="text-xs text-muted-foreground">
                      Descrição
                    </label>
                    <Input
                      className="h-10 rounded-xl"
                      value={row.description}
                      onChange={(e) => {
                        const next = [...labor];
                        next[i] = { ...row, description: e.target.value };
                        setLabor(next);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">Horas</label>
                    <Input
                      type="number"
                      step="0.5"
                      className="h-10 rounded-xl"
                      value={row.hours}
                      onChange={(e) => {
                        const next = [...labor];
                        next[i] = { ...row, hours: e.target.value };
                        setLabor(next);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">
                      Valor/hora
                    </label>
                    <Input
                      type="number"
                      className="h-10 rounded-xl"
                      value={row.hourlyRate}
                      onChange={(e) => {
                        const next = [...labor];
                        next[i] = { ...row, hourlyRate: e.target.value };
                        setLabor(next);
                      }}
                    />
                  </div>
                  <div className="md:col-span-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      R${" "}
                      {(
                        (Number(row.hours) || 0) *
                        (Number(row.hourlyRate) || 0)
                      ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() =>
                        setLabor(labor.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    setLabor([
                      ...labor,
                      { description: "", hours: "1", hourlyRate: "100" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Linha
                </Button>
                <p className="font-bold">
                  Subtotal: R${" "}
                  {laborSubtotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <Button
                  onClick={saveLaborItems}
                  disabled={loading}
                  className="rounded-xl"
                >
                  Salvar mão de obra
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <Card className="rounded-xl">
            <CardContent className="p-5 space-y-4">
              <Row label="Peças" value={partsSubtotal} />
              <Row label="Mão de obra" value={laborSubtotal} />
              <Row label="Desconto" value={discount} negative />
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  R${" "}
                  {grand.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Button
                onClick={sendBudget}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-success hover:bg-success/90 text-white font-semibold text-base"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Enviar orçamento via WhatsApp
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card className="rounded-xl">
            <CardContent className="p-5">
              <ol className="relative border-s border-border ms-3 space-y-6">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="ms-6">
                    <span className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-brand-orange ring-4 ring-background" />
                    <p className="font-semibold text-sm">
                      {h.fromStatus
                        ? `${osStatusLabel(h.fromStatus)} → `
                        : ""}
                      {osStatusLabel(h.toStatus)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.createdAt).toLocaleString("pt-BR")}
                      {h.changedByName ? ` · ${h.changedByName}` : " · Sistema"}
                    </p>
                    {h.notes ? (
                      <p className="text-sm mt-1">{h.notes}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4 space-y-3">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-3">
              <div className="grid sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Legenda (obrigatória)"
                  className="h-10 rounded-xl sm:col-span-2"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                />
                <select
                  className={selectClassName}
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value)}
                >
                  <option value="ANTES">Antes</option>
                  <option value="DEPOIS">Depois</option>
                  <option value="DIAGNOSTICO">Diagnóstico</option>
                  <option value="PECA">Peça</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
              <Button
                type="button"
                className="rounded-xl bg-brand-orange text-white"
                disabled={loading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Enviar foto
              </Button>

              {order.photos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma foto. Adicione com legenda (antes/depois).
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {order.photos.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.caption}
                        className="h-40 w-full object-cover"
                      />
                      <div className="p-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{p.caption}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.type}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          onClick={async () => {
                            const res = await deleteServiceOrderPhotoAction(
                              p.id,
                              order.id
                            );
                            if (!res.success) toast.error(res.error);
                            else {
                              toast.success("Foto removida");
                              router.refresh();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {negative ? "− " : ""}
        R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}
