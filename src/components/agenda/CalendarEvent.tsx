import { format } from "date-fns";
import type { Appointment } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface CalendarEventProps {
  appointment: Appointment;
  onClick: () => void;
  compact?: boolean;
  ultraCompact?: boolean;
}

export function CalendarEvent({ appointment, onClick, compact = false, ultraCompact = false }: CalendarEventProps) {
  const barberColor = appointment.barber?.calendar_color || "#FF6B00";
  const startTime = format(new Date(appointment.start_time), "HH:mm");
  const endTime = format(new Date(appointment.end_time), "HH:mm");
  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";

  // Ultra compact mode: colored dot + time + client name in single line
  if (ultraCompact) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "w-full text-left flex items-center gap-1 py-0.5 px-1 rounded text-[11px] hover:bg-muted/50 transition-colors truncate",
          isCancelled && "opacity-50 line-through"
        )}
        title={`${startTime} - ${appointment.client_name} (${appointment.barber?.name || 'N/A'})`}
      >
        <span 
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: isCancelled ? "hsl(var(--muted-foreground))" : barberColor }}
        />
        <span className="font-semibold shrink-0">{startTime}</span>
        <span className="truncate text-muted-foreground">{appointment.client_name}</span>
      </button>
    );
  }

  if (compact) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-all hover:opacity-80",
          isCancelled && "opacity-50 line-through"
        )}
        style={{
          backgroundColor: isCancelled ? "hsl(var(--muted))" : `${barberColor}20`,
          borderLeft: `3px solid ${isCancelled ? "hsl(var(--muted-foreground))" : barberColor}`,
        }}
      >
        <span className="font-medium">{startTime}</span> {appointment.client_name}
        {isCancelled && <span className="ml-1 text-[10px] text-muted-foreground">(Cancelado)</span>}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "w-full text-left p-2 rounded-md transition-all hover:scale-[1.02] hover:shadow-lg group",
        isCancelled && "opacity-60"
      )}
      style={{
        backgroundColor: isCancelled ? "hsl(var(--muted))" : `${barberColor}15`,
        borderLeft: `4px solid ${isCancelled ? "hsl(var(--muted-foreground))" : barberColor}`,
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn(
          "text-xs font-semibold text-foreground",
          isCancelled && "line-through"
        )}>
          {startTime} - {endTime}
        </span>
        {isCancelled && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted-foreground/20 text-muted-foreground">
            Cancelado
          </span>
        )}
        {isCompleted && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-600">
            Finalizado
          </span>
        )}
      </div>
      <p className={cn(
        "text-sm font-medium text-foreground truncate mt-0.5",
        isCancelled && "line-through"
      )}>
        {appointment.client_name}
      </p>
      {appointment.service && (
        <p className={cn(
          "text-xs text-muted-foreground truncate",
          isCancelled && "line-through"
        )}>
          {appointment.service.name}
        </p>
      )}
      {appointment.barber && (
        <p className="text-xs text-muted-foreground/70 truncate">
          {appointment.barber.name}
        </p>
      )}
    </button>
  );
}
