"use client";

import type { SlotSessionType } from "@/lib/sessionType";

const OPTIONS: { value: SlotSessionType; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "offline", label: "On-Site" },
  { value: "both", label: "Client's choice" },
];

export function SessionTypePicker({
  value,
  onChange,
}: {
  value: SlotSessionType;
  onChange: (value: SlotSessionType) => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium text-muted">Session type</legend>
      <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg ring-1 ring-border">
        {OPTIONS.map(({ value: option, label }) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={`px-2 py-2.5 text-sm transition ${
                selected
                  ? "bg-primary/[0.08] font-semibold text-primary"
                  : "bg-surface font-medium text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
