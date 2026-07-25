"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { ServiceOrderDetail } from "@/lib/data/types";
import {
  OS_STATUS_COLORS,
  OS_STATUS_ORDER,
  osStatusLabel,
} from "@/lib/service-orders/status";
import { formatPlate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { publicApproveBudgetAction } from "@/lib/actions/service-orders";
import { PublicChat } from "@/components/chat/public-chat";

export function PublicTracking({ order }: { order: ServiceOrderDetail }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function decide(approve: boolean) {
    setLoading(true);
    try {
      const res = await publicApproveBudgetAction(order.publicToken, approve);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const statusIdx = OS_STATUS_ORDER.indexOf(
    order.status === "CANCELADO" ? "ORCAMENTO" : order.status
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white font-bold">
            RP
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Acompanhe sua OS
          </h1>
          <p className="text-sm text-slate-500">Roberto Pneus</p>
        </div>

        <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-2xl font-bold">OS #{order.number}</p>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: OS_STATUS_COLORS[order.status] }}
            >
              {osStatusLabel(order.status)}
            </span>
          </div>
          <div className="text-sm space-y-1">
            <p className="font-medium">{order.client.name}</p>
            <p className="text-slate-600">
              {formatPlate(order.vehicle.plate)} · {order.vehicle.brand}{" "}
              {order.vehicle.model}
            </p>
          </div>

          {/* Progress */}
          {order.status !== "CANCELADO" ? (
            <div className="flex gap-1 pt-2">
              {OS_STATUS_ORDER.map((s, i) => (
                <div
                  key={s}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    background:
                      i <= statusIdx
                        ? OS_STATUS_COLORS[s]
                        : "#E2E8F0",
                  }}
                  title={osStatusLabel(s)}
                />
              ))}
            </div>
          ) : null}

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-1">Total</p>
            <p className="text-xl font-bold text-[#0A2540]">
              R${" "}
              {order.grandTotal.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          {order.status === "ORCAMENTO" ? (
            <div className="space-y-2 pt-1">
              <p className="text-sm text-slate-600 text-center">
                Este orçamento aguarda sua aprovação
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  disabled={loading}
                  onClick={() => decide(true)}
                  className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-1" />
                      Aprovar
                    </>
                  )}
                </Button>
                <Button
                  disabled={loading}
                  variant="outline"
                  onClick={() => decide(false)}
                  className="h-12 rounded-xl border-red-300 text-red-600 font-semibold"
                >
                  <X className="h-5 w-5 mr-1" />
                  Recusar
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <PublicChat token={order.publicToken} />

        <div className="rounded-2xl bg-white border shadow-sm p-5">
          <h2 className="font-semibold mb-4">Histórico</h2>
          <ol className="relative border-s border-slate-200 ms-2 space-y-5">
            {order.statusHistory.map((h) => (
              <li key={h.id} className="ms-5">
                <span
                  className="absolute -start-1.5 mt-1 h-3 w-3 rounded-full ring-4 ring-white"
                  style={{ background: OS_STATUS_COLORS[h.toStatus] }}
                />
                <p className="text-sm font-semibold">
                  {osStatusLabel(h.toStatus)}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(h.createdAt).toLocaleString("pt-BR")}
                </p>
                {h.notes ? (
                  <p className="text-sm text-slate-600 mt-0.5">{h.notes}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <p className="text-center text-xs text-slate-400">
          Roberto Pneus App · acompanhamento sem login
        </p>
      </div>
    </div>
  );
}
