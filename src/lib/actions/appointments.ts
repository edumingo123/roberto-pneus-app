"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/action-result";
import {
  createAppointment,
  setAppointmentStatus,
  updateAppointment,
  type AppointmentFormInput,
} from "@/lib/data/appointments";
import {
  appointmentFormSchema,
  toAppointmentInput,
} from "@/lib/validations/appointment";
import type { AppointmentRecord, AppointmentStatus } from "@/lib/data/types";
import { publicAppUrl, sendTemplatedWhatsApp } from "@/lib/whatsapp/notify";
import { getDemoStore } from "@/lib/data/demo-store";

export async function createAppointmentAction(
  raw: unknown
): Promise<ActionResult<AppointmentRecord>> {
  try {
    const session = await requireSession();
    const parsed = appointmentFormSchema.parse(raw);
    const input: AppointmentFormInput = toAppointmentInput(parsed);
    const appt = await createAppointment(session.user.tenantId, input);

    if (appt.status === "CONFIRMADO" && appt.publicToken) {
      const store = getDemoStore();
      const client = store.clients.find((c) => c.id === appt.clientId);
      if (client?.whatsapp) {
        await sendTemplatedWhatsApp({
          tenantId: session.user.tenantId,
          toPhone: client.whatsapp,
          templateKey: "appointment_confirmation",
          variables: {
            cliente_nome: client.name,
            data_hora: new Date(appt.startsAt).toLocaleString("pt-BR"),
            oficina_nome: session.tenant.name,
            link_publico: publicAppUrl(
              `/acompanhamento/agendamento/${appt.publicToken}`
            ),
          },
        });
      }
    }

    revalidatePath("/agendamentos");
    return ok(appt, "Agendamento criado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao criar agendamento");
  }
}

export async function updateAppointmentAction(
  id: string,
  raw: unknown
): Promise<ActionResult<AppointmentRecord>> {
  try {
    const session = await requireSession();
    const parsed = appointmentFormSchema.parse(raw);
    const input = toAppointmentInput(parsed);
    const appt = await updateAppointment(session.user.tenantId, id, input);
    if (!appt) return fail("Agendamento não encontrado");
    revalidatePath("/agendamentos");
    return ok(appt, "Agendamento atualizado");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao atualizar");
  }
}

export async function setAppointmentStatusAction(
  id: string,
  status: AppointmentStatus
): Promise<ActionResult<AppointmentRecord>> {
  try {
    const session = await requireSession();
    if (
      status === "CONFIRMADO" ||
      status === "CANCELADO"
    ) {
      // only admin/reception typically approve AI appointments
      if (
        session.user.role === "MECANICO" &&
        status === "CONFIRMADO"
      ) {
        // allow mechanics to confirm? Spec says Admin — restrict approve to ADMIN/RECEPCIONISTA
      }
    }
    if (
      (status === "CONFIRMADO" || status === "CANCELADO") &&
      session.user.role === "MECANICO"
    ) {
      // allow only admin/reception for AI approval
      const store = getDemoStore();
      const existing = store.appointments.find((a) => a.id === id);
      if (existing?.createdByAi && existing.status === "AGUARDANDO_APROVACAO") {
        return fail("Apenas Admin ou Recepcionista pode aprovar agendamentos da IA");
      }
    }

    const appt = await setAppointmentStatus(
      session.user.tenantId,
      id,
      status
    );
    if (!appt) return fail("Agendamento não encontrado");

    if (status === "CONFIRMADO" && appt.publicToken) {
      const store = getDemoStore();
      const client = store.clients.find((c) => c.id === appt.clientId);
      if (client?.whatsapp) {
        await sendTemplatedWhatsApp({
          tenantId: session.user.tenantId,
          toPhone: client.whatsapp,
          templateKey: "appointment_confirmation",
          variables: {
            cliente_nome: client.name,
            data_hora: new Date(appt.startsAt).toLocaleString("pt-BR"),
            oficina_nome: session.tenant.name,
            link_publico: publicAppUrl(
              `/acompanhamento/agendamento/${appt.publicToken}`
            ),
          },
        });
      }
    }

    revalidatePath("/agendamentos");
    return ok(
      appt,
      status === "CONFIRMADO"
        ? "Agendamento aprovado"
        : status === "CANCELADO"
          ? "Agendamento recusado/cancelado"
          : "Status atualizado"
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao atualizar status");
  }
}
