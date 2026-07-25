"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  dateFnsLocalizer,
  type View,
  type EventProps,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { AppointmentDetail } from "@/lib/data/types";
import { APPOINTMENT_STATUS_COLORS } from "@/lib/service-orders/status";
import { APPOINTMENT_STATUS_LABELS } from "@/types";
import { formatPlate } from "@/lib/format";
import { cn } from "@/lib/utils";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: AppointmentDetail;
}

function EventChip({ event }: EventProps<CalendarEvent>) {
  const a = event.resource;
  const color = APPOINTMENT_STATUS_COLORS[a.status] ?? "#64748B";
  const shortName = a.client.name.split(" ").slice(0, 2).join(" ");
  const plate = a.vehicle ? formatPlate(a.vehicle.plate) : "—";
  const mech = a.mechanic?.name?.split(" ")[0] ?? "Sem mec.";

  return (
    <div className="text-[10px] leading-tight px-0.5 overflow-hidden h-full">
      <div className="font-semibold truncate" style={{ color: "#fff" }}>
        {shortName} · {plate}
      </div>
      <div className="truncate opacity-90" style={{ color: "#fff" }}>
        {format(event.start, "HH:mm")} · {mech}
      </div>
      <div className="truncate opacity-80" style={{ color: "#fff" }}>
        {APPOINTMENT_STATUS_LABELS[a.status]}
      </div>
      <span className="sr-only" style={{ background: color }} />
    </div>
  );
}

interface Props {
  appointments: AppointmentDetail[];
}

export function AppointmentsCalendar({ appointments }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());

  const events: CalendarEvent[] = useMemo(
    () =>
      appointments.map((a) => ({
        id: a.id,
        title: a.title,
        start: new Date(a.startsAt),
        end: new Date(a.endsAt),
        resource: a,
      })),
    [appointments]
  );

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const bg =
      APPOINTMENT_STATUS_COLORS[event.resource.status] ?? "#64748B";
    return {
      style: {
        backgroundColor: bg,
        borderRadius: "8px",
        border: "none",
        color: "#fff",
        padding: "2px 4px",
        fontSize: "11px",
      },
    };
  }, []);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-2 md:p-4 shadow-sm",
        "rbc-roberto [&_.rbc-toolbar_button]:rounded-lg [&_.rbc-toolbar_button]:border-border",
        "[&_.rbc-toolbar_button.rbc-active]:bg-primary [&_.rbc-toolbar_button.rbc-active]:text-primary-foreground",
        "[&_.rbc-header]:py-2 [&_.rbc-header]:text-xs [&_.rbc-header]:font-semibold",
        "[&_.rbc-today]:bg-brand-orange/5",
        "min-h-[560px] md:min-h-[640px]"
      )}
    >
      <Calendar
        culture="pt-BR"
        localizer={localizer}
        events={events}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={["month", "week", "day"]}
        step={30}
        timeslots={2}
        min={new Date(1970, 0, 1, 7, 0)}
        max={new Date(1970, 0, 1, 19, 0)}
        style={{ height: 600 }}
        messages={{
          month: "Mês",
          week: "Semana",
          day: "Dia",
          today: "Hoje",
          previous: "Anterior",
          next: "Próximo",
          agenda: "Agenda",
          showMore: (n) => `+${n} mais`,
          noEventsInRange: "Nenhum agendamento neste período",
        }}
        eventPropGetter={eventStyleGetter}
        components={{ event: EventChip }}
        onSelectEvent={(event) => {
          router.push(`/agendamentos?selected=${event.id}`);
        }}
        selectable
        onSelectSlot={(slot) => {
          const d = format(slot.start, "yyyy-MM-dd");
          const t = format(slot.start, "HH:mm");
          router.push(`/agendamentos/novo?date=${d}&startTime=${t}`);
        }}
      />
    </div>
  );
}
