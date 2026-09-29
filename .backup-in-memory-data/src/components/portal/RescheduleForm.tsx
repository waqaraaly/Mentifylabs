import type { Slot } from "@/types/slot";
import { sessionTypeLabel } from "@/lib/sessionType";
import { formatDate } from "@/lib/format";
import { rescheduleAppointmentAction } from "@/app/dashboard/sessions/actions";

const fieldClass =
  "rounded-xl bg-black/[0.025] px-3 py-2 text-sm outline-none ring-1 ring-transparent focus:bg-surface focus:ring-primary/40 transition";

export function RescheduleForm({
  appointmentId,
  practitionerSlug,
  openSlots,
}: {
  appointmentId: string;
  practitionerSlug: string;
  openSlots: Slot[];
}) {
  return (
    <details className="mt-2 group">
      <summary className="cursor-pointer text-sm font-medium text-primary">
        Reschedule
      </summary>

      <form
        action={rescheduleAppointmentAction}
        className="mt-3 space-y-4 rounded-2xl bg-black/[0.02] p-4"
      >
        <input type="hidden" name="id" value={appointmentId} />
        <input type="hidden" name="slug" value={practitionerSlug} />

        {openSlots.length > 0 && (
          <div>
            <label className="text-xs font-medium tracking-[0.08em] text-muted uppercase">
              Pick an open slot
            </label>
            <select name="slotId" className={`mt-2 w-full ${fieldClass}`} defaultValue="">
              <option value="">— Select —</option>
              {openSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {formatDate(slot.date)}, {slot.startTime}–{slot.endTime} ({sessionTypeLabel(slot.sessionType)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <p className="text-xs font-medium tracking-[0.08em] text-muted uppercase">
            Or propose a new time
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input type="date" name="date" className={fieldClass} />
            <input type="time" name="startTime" className={fieldClass} />
            <input type="time" name="endTime" className={fieldClass} />
            <select name="sessionType" defaultValue="online" className={fieldClass}>
              <option value="online">Online</option>
              <option value="offline">On-Site</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Propose new time
        </button>
      </form>
    </details>
  );
}
