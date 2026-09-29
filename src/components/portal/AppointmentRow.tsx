import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import type { Appointment } from "@/types/appointment";

export function AppointmentRow({
  appointment,
  children,
}: {
  appointment: Appointment;
  children?: ReactNode;
}) {
  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-medium">{appointment.clientName}</p>
          <p className="text-sm text-muted">{appointment.clientContact}</p>
          {appointment.concern && (
            <p className="mt-2 max-w-prose rounded-xl bg-private-surface px-3 py-2 text-sm text-foreground/80">
              &ldquo;{appointment.concern}&rdquo;
              <span className="ml-2 text-xs font-medium tracking-[0.06em] text-muted uppercase">
                Not shared publicly
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-black/[0.03] px-3 py-1.5 text-sm text-muted">
          <Clock className="size-3.5" aria-hidden />
          <span className="font-medium text-foreground">
            {appointment.startTime}–{appointment.endTime}
          </span>
          <span>· {appointment.sessionType}</span>
        </div>
      </div>
      {children}
    </li>
  );
}

export function ActionButton({
  formAction,
  label,
  variant = "default",
}: {
  formAction: (formData: FormData) => void;
  label: string;
  variant?: "default" | "primary" | "alert";
}) {
  const styles = {
    default: "text-muted hover:text-foreground",
    primary: "rounded-full bg-primary px-4 py-1.5 text-primary-foreground shadow-sm hover:opacity-90",
    alert: "text-muted hover:text-alert",
  } as const;

  return (
    <button
      type="submit"
      formAction={formAction}
      className={`text-sm font-medium transition ${styles[variant]}`}
    >
      {label}
    </button>
  );
}
