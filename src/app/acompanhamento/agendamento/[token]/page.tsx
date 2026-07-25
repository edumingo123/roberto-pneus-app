import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppointmentByPublicToken } from "@/lib/data/appointments";
import { APPOINTMENT_STATUS_LABELS } from "@/types";
import { formatPlate } from "@/lib/format";
import { APPOINTMENT_STATUS_COLORS } from "@/lib/service-orders/status";

export const metadata: Metadata = {
  title: "Acompanhamento do agendamento",
};

export default async function PublicAppointmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const appt = await getAppointmentByPublicToken(token);
  if (!appt) notFound();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white font-bold">
            RP
          </div>
          <h1 className="text-xl font-bold text-slate-900">Agendamento</h1>
          <p className="text-sm text-slate-500">Acompanhamento público</p>
        </div>

        <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-4">
          <div
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{
              background:
                APPOINTMENT_STATUS_COLORS[appt.status] ?? "#64748B",
            }}
          >
            {APPOINTMENT_STATUS_LABELS[appt.status]}
          </div>
          <div>
            <p className="text-lg font-bold">{appt.client.name}</p>
            <p className="text-sm text-slate-600">{appt.title}</p>
          </div>
          <div className="text-sm space-y-1 text-slate-700">
            <p>
              <span className="text-slate-500">Quando: </span>
              {new Date(appt.startsAt).toLocaleString("pt-BR")}
            </p>
            <p>
              <span className="text-slate-500">Até: </span>
              {new Date(appt.endsAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {appt.vehicle ? (
              <p>
                <span className="text-slate-500">Veículo: </span>
                {formatPlate(appt.vehicle.plate)} · {appt.vehicle.brand}{" "}
                {appt.vehicle.model}
              </p>
            ) : null}
            {appt.mechanic ? (
              <p>
                <span className="text-slate-500">Mecânico: </span>
                {appt.mechanic.name}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
