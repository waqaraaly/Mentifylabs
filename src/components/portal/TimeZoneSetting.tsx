"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTimezoneAction } from "@/app/dashboard/settings/timezoneActions";
import { timeZoneOptions } from "@/lib/time";
import { useDeviceTimeZone } from "@/lib/useDeviceTimeZone";
import { Field } from "./Field";
import { settingsInputClass } from "./SettingsRow";

/** The body and footer of the Time zone card; the Settings page supplies the card and its header. */
export function TimeZoneSetting({ saved }: { saved: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [zone, setZone] = useState(saved);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const device = useDeviceTimeZone();
  const options = useMemo(() => timeZoneOptions(), []);

  // The saved zone is always in the list, even if the platform's own list somehow lacks it.
  const list = options.some((o) => o.value === saved) ? options : [{ value: saved, label: saved }, ...options];

  const save = () =>
    startTransition(async () => {
      const result = await updateTimezoneAction(zone);
      setNote({ ok: result.ok, text: result.message });
      if (result.ok) router.refresh();
      else setZone(saved);
    });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 px-6 py-6">
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          Your slots, sessions and dashboard all run on this clock.
        </p>

        <Field label="Your time zone" htmlFor="timezone">
          <select id="timezone" value={zone} onChange={(e) => setZone(e.target.value)} className={settingsInputClass}>
            {list.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {device && device !== zone && (
          <p className="text-sm text-muted">
            This device is set to <span className="font-medium text-foreground">{device.replace(/_/g, " ")}</span>.{" "}
            <button type="button" onClick={() => setZone(device)} className="font-medium text-primary hover:underline">
              Use it
            </button>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] px-6 py-4">
        {note ? (
          <p role="status" className={`text-sm font-medium ${note.ok ? "text-success" : "text-alert"}`}>
            {note.text}
          </p>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={pending || zone === saved}
          onClick={save}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save time zone"}
        </button>
      </div>
    </div>
  );
}
