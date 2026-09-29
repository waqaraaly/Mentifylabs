"use client";

import { useState, type FormEvent } from "react";
import { TriangleAlert } from "lucide-react";
import { WEEKDAYS_FULL } from "@/lib/format";
import type { SlotSessionType } from "@/lib/sessionType";
import type { WeeklyRule } from "@/types/availability";
import {
  addWeeklyRuleAction,
  updateWeeklyRuleAction,
  removeWeeklyRuleAction,
  copyWeeklyRuleAction,
} from "@/app/dashboard/slots/actions";
import { SidePanel } from "./SidePanel";
import { SessionTypePicker } from "./SessionTypePicker";

const fieldClass =
  "w-full rounded-lg bg-surface px-3.5 py-2.5 text-base outline-none ring-1 ring-border transition focus:ring-2 focus:ring-primary/50";
const labelClass = "block text-sm font-medium text-muted";

// Monday..Sunday, matching the rest of the app's week-starts-Monday convention.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function WeeklyDayPopup({
  weekday,
  rule,
  practitionerSlug,
  onClose,
}: {
  weekday: number;
  rule: WeeklyRule | undefined;
  practitionerSlug: string;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [copyTargets, setCopyTargets] = useState<Set<number>>(new Set());
  const [sessionType, setSessionType] = useState<SlotSessionType>(rule?.sessionType ?? "online");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTarget(d: number) {
    setCopyTargets((set) => {
      const next = new Set(set);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await (rule ? updateWeeklyRuleAction(formData) : addWeeklyRuleAction(formData));
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  async function handleRemove() {
    if (!rule) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("id", rule.id);
    formData.set("slug", practitionerSlug);
    await removeWeeklyRuleAction(formData);
    setPending(false);
    onClose();
  }

  async function handleCopy() {
    if (!rule || copyTargets.size === 0) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("id", rule.id);
    formData.set("slug", practitionerSlug);
    for (const d of copyTargets) formData.append("targets", String(d));
    const result = await copyWeeklyRuleAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <SidePanel
      title={rule ? "Edit weekly slot" : "Add weekly slot"}
      subtitle={`Every ${WEEKDAYS_FULL[weekday]}`}
      variant="modal"
      onClose={onClose}
    >
      <div className="flex-1 space-y-7 overflow-y-auto px-7 py-4">
        <section>
          <form id="weekly-slot-form" onSubmit={handleSave} className="space-y-5">
            <input type="hidden" name="slug" value={practitionerSlug} />
            <input type="hidden" name="weekday" value={weekday} />
            <input type="hidden" name="sessionType" value={sessionType} />
            {rule && <input type="hidden" name="id" value={rule.id} />}

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className={labelClass}>Start time</span>
                <input
                  type="time"
                  name="startTime"
                  required
                  defaultValue={rule?.startTime ?? "09:00"}
                  className={fieldClass}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>End time</span>
                <input
                  type="time"
                  name="endTime"
                  required
                  defaultValue={rule?.endTime ?? "09:50"}
                  className={fieldClass}
                />
              </label>
            </div>

            <SessionTypePicker value={sessionType} onChange={setSessionType} />

            {error && (
              <div className="flex items-start gap-2 text-sm text-alert">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>{error}</p>
              </div>
            )}

            <p className="text-sm text-muted">Applies to all future dates except special dates.</p>
          </form>
        </section>

        {rule && (
          <section className="space-y-3">
            <h3 className={labelClass}>Copy this slot to</h3>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_ORDER.filter((d) => d !== weekday).map((d) => {
                const checked = copyTargets.has(d);
                return (
                  <label key={d} className="cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => toggleTarget(d)} className="peer sr-only" />
                    <span className="inline-flex items-center rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium text-muted ring-1 ring-border transition peer-checked:bg-primary/[0.1] peer-checked:text-primary peer-checked:ring-primary hover:bg-foreground/[0.08]">
                      {WEEKDAYS_FULL[d].slice(0, 3)}
                    </span>
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={pending || copyTargets.size === 0}
              className="text-sm font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              Copy to {copyTargets.size || ""} {copyTargets.size === 1 ? "day" : "days"}
            </button>
          </section>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-7 py-4">
        {confirmingRemove ? (
          <>
            <p className="text-sm font-medium">Remove this weekly slot?</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmingRemove(false)}
                disabled={pending}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition hover:text-foreground"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={pending}
                className="rounded-lg bg-alert px-5 py-2.5 text-sm font-semibold text-alert-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Removing…" : "Remove"}
              </button>
            </div>
          </>
        ) : (
          <>
            {rule ? (
              <button
                type="button"
                onClick={() => setConfirmingRemove(true)}
                disabled={pending}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-alert transition hover:bg-alert/[0.08] disabled:opacity-60"
              >
                Remove
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="weekly-slot-form"
                disabled={pending}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Saving…" : rule ? "Save changes" : "Add slot"}
              </button>
            </div>
          </>
        )}
      </div>
    </SidePanel>
  );
}
