"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { settingsInputClass } from "@/components/portal/SettingsRow";

interface Entry {
  id: string;
  title: string;
  place: string;
  from: string;
  to: string;
}

/** Commas separate the parts in the stored string, so they can't appear inside a part. */
const clean = (value: string) => value.replace(/,/g, " ").replace(/\s+/g, " ").trim();

/** "Title, Place, 2010–2014"  ->  structured fields. Tolerates missing parts. */
function parse(raw: string): Omit<Entry, "id"> {
  const parts = raw.split(",").map((p) => p.trim());
  const title = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const hasYears = /\d/.test(last);
  const years = hasYears ? last : "";
  const place = parts.slice(1, hasYears ? -1 : undefined).join(" ");
  const [from = "", to = ""] = years.split(/\s*[–—-]\s*/);
  return { title, place, from, to };
}

function serialize(e: Entry): string {
  const years = e.from && e.to ? `${clean(e.from)}–${clean(e.to)}` : clean(e.from || e.to);
  return [clean(e.title), clean(e.place), years].filter(Boolean).join(", ");
}

/**
 * Structured add/remove list for dated entries (degrees, roles). Each entry is
 * edited as separate fields but submitted as one "Title, Place, Years" string
 * per hidden input sharing `name`, so the form's FormData.getAll(name) — and
 * the public timeline that parses that format — need no changes.
 */
export function EntryListEditor({
  name,
  initialItems,
  titleLabel,
  placeLabel,
  titlePlaceholder,
  placePlaceholder,
  addLabel,
}: {
  name: string;
  initialItems: string[];
  titleLabel: string;
  placeLabel: string;
  titlePlaceholder: string;
  placePlaceholder: string;
  addLabel: string;
}) {
  const [entries, setEntries] = useState<Entry[]>(() =>
    // Stable ids for the first render, so the server and browser agree; new rows get a random one when added.
    initialItems.map((raw, i) => ({ id: `initial-${i}`, ...parse(raw) })),
  );

  const update = (id: string, patch: Partial<Entry>) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const add = () =>
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), title: "", place: "", from: "", to: "" }]);

  const smallLabel = "mb-1 block text-xs font-medium text-muted";

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const value = serialize(entry);
        return (
          <div key={entry.id} className="rounded-xl bg-black/[0.025] p-4 ring-1 ring-black/[0.04]">
            {value && <input type="hidden" name={name} value={value} />}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={smallLabel} htmlFor={`${entry.id}-title`}>
                  {titleLabel}
                </label>
                <input
                  id={`${entry.id}-title`}
                  value={entry.title}
                  onChange={(e) => update(entry.id, { title: e.target.value })}
                  placeholder={titlePlaceholder}
                  className={`${settingsInputClass} !bg-surface`}
                />
              </div>
              <div>
                <label className={smallLabel} htmlFor={`${entry.id}-place`}>
                  {placeLabel}
                </label>
                <input
                  id={`${entry.id}-place`}
                  value={entry.place}
                  onChange={(e) => update(entry.id, { place: e.target.value })}
                  placeholder={placePlaceholder}
                  className={`${settingsInputClass} !bg-surface`}
                />
              </div>
            </div>

            <div className="mt-3 flex items-end gap-3">
              <div className="w-28">
                <label className={smallLabel} htmlFor={`${entry.id}-from`}>
                  From
                </label>
                <input
                  id={`${entry.id}-from`}
                  value={entry.from}
                  onChange={(e) => update(entry.id, { from: e.target.value })}
                  placeholder="2018"
                  inputMode="numeric"
                  maxLength={4}
                  className={`${settingsInputClass} !bg-surface`}
                />
              </div>
              <div className="w-28">
                <label className={smallLabel} htmlFor={`${entry.id}-to`}>
                  To
                </label>
                <input
                  id={`${entry.id}-to`}
                  value={entry.to}
                  onChange={(e) => update(entry.id, { to: e.target.value })}
                  placeholder="Present"
                  maxLength={7}
                  className={`${settingsInputClass} !bg-surface`}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(entry.id)}
                aria-label={`Remove ${entry.title || "entry"}`}
                className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-black/[0.06] hover:text-alert"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-lg bg-black/[0.04] px-4 py-2 text-sm font-medium transition hover:bg-black/[0.07]"
      >
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}
