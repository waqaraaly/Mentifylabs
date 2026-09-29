"use client";

import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import type { ContactMethod } from "@/types/practitioner";

const fieldClass =
  "rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-black/[0.06] focus:ring-primary/40 transition";

const FIELD_META: Record<string, { icon: typeof Mail; type: string; placeholder: string }> = {
  Email: { icon: Mail, type: "email", placeholder: "e.g. name@example.com" },
  Phone: { icon: Phone, type: "tel", placeholder: "e.g. +92 300 1234567" },
};

/** The fixed Email and Phone rows, each with its own Public/Private toggle. */
export function ContactDetailsEditor({ initialItems }: { initialItems: ContactMethod[] }) {
  const [items, setItems] = useState<ContactMethod[]>(initialItems);

  const updateItem = (label: string, patch: Partial<ContactMethod>) =>
    setItems((prev) => prev.map((item) => (item.label === label ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const meta = FIELD_META[item.label];
        const Icon = meta?.icon ?? Mail;
        const inputId = `contact-${item.label.toLowerCase()}`;

        return (
          <div
            key={item.label}
            className="flex flex-wrap items-center gap-2.5 rounded-xl bg-black/[0.025] p-2.5"
          >
            <input type="hidden" name="contactLabel" value={item.label} />
            <input type="hidden" name="contactValue" value={item.value} />
            <input type="hidden" name="contactPublic" value={item.isPublic ? "true" : "false"} />

            <label htmlFor={inputId} className="flex w-full items-center gap-2 text-sm font-medium sm:w-28">
              <Icon className="size-4 text-muted" aria-hidden />
              {item.label}
            </label>
            <input
              id={inputId}
              type={meta?.type ?? "text"}
              value={item.value}
              onChange={(e) => updateItem(item.label, { value: e.target.value })}
              placeholder={meta?.placeholder}
              className={`min-w-[10rem] flex-1 ${fieldClass}`}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateItem(item.label, { isPublic: !item.isPublic })}
                aria-pressed={item.isPublic}
                aria-label={`Make ${item.label} ${item.isPublic ? "private" : "public"}`}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  item.isPublic ? "bg-primary" : "bg-black/15"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${
                    item.isPublic ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="w-12 text-xs font-medium text-muted">
                {item.isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
