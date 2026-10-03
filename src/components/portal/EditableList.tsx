"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

interface Item {
  id: string;
  value: string;
}

/**
 * A structured add/remove list, submitted as repeated hidden inputs sharing
 * `name` so the parent <form>'s FormData.getAll(name) sees a plain string[].
 */
export function EditableList({
  name,
  initialItems,
  placeholder,
  variant = "tags",
  chipClassName = "bg-primary/[0.1] text-primary",
}: {
  name: string;
  initialItems: string[];
  placeholder: string;
  variant?: "tags" | "list";
  /** Full Tailwind background+text classes for tag chips (variant="tags" only). */
  chipClassName?: string;
}) {
  const [items, setItems] = useState<Item[]>(() =>
    initialItems.map((value) => ({ id: crypto.randomUUID(), value })),
  );
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const value = draft.trim().replace(/,$/, "");
    if (!value) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), value }]);
    setDraft("");
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addItem();
    } else if (e.key === "Backspace" && draft === "" && items.length > 0) {
      removeItem(items[items.length - 1].id);
    }
  };

  const handleListKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div>
      {items.map((item) => (
        <input key={item.id} type="hidden" name={name} value={item.value} />
      ))}

      {variant === "tags" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-black/[0.025] p-2.5 ring-1 ring-transparent focus-within:bg-surface focus-within:ring-primary/40 transition">
          {items.map((item) => (
            <span
              key={item.id}
              className={`inline-flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-sm font-medium ${chipClassName}`}
            >
              {item.value}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="flex size-4 items-center justify-center rounded-full opacity-60 transition hover:bg-black/10 hover:opacity-100"
                aria-label={`Remove ${item.value}`}
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addItem}
            placeholder={items.length === 0 ? placeholder : "Add another…"}
            className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none"
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.025] px-3.5 py-2.5 text-sm"
            >
              <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="min-w-0 flex-1">{item.value}</span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="flex shrink-0 items-center justify-center text-muted transition hover:text-alert"
                aria-label={`Remove ${item.value}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleListKeyDown}
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-xl bg-black/[0.025] px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent focus:bg-surface focus:ring-primary/40 transition"
            />
            <button
              type="button"
              onClick={addItem}
              className="flex shrink-0 items-center gap-1 rounded-xl bg-black/[0.025] px-3.5 py-2.5 text-sm font-medium text-muted transition hover:bg-black/[0.05] hover:text-foreground"
            >
              <Plus className="size-3.5" aria-hidden />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
