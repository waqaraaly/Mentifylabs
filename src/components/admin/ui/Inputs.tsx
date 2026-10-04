"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  width = 260,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number;
}) {
  return (
    <div style={{ position: "relative", width }}>
      <input
        className="input input-plain"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  width = 190,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selectedIdx = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const choose = (v: string) => { onChange(v); setOpen(false); };
  const toggle = () => { setHl(selectedIdx); setOpen((o) => !o); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { toggle(); return; }
      setHl((i) => (e.key === "ArrowDown" ? Math.min(options.length - 1, i + 1) : Math.max(0, i - 1)));
    } else if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      choose(options[hl].value);
    }
  };

  return (
    <div className="dd" ref={ref} style={{ width }}>
      <button
        type="button"
        className="input input-plain dd-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKeyDown}
        >
        <span className="truncate">{options[selectedIdx]?.label}</span>
      </button>
      <ChevronDown size={12} style={{ position: "absolute", right: 10, top: 12, color: "var(--ml-ink-subtle)", pointerEvents: "none" }} />
      {open && (
        <div className="dd-menu" role="listbox">
          {options.map((o, i) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`dd-opt${i === hl ? " hl" : ""}`}
              onMouseEnter={() => setHl(i)}
              onClick={() => choose(o.value)}
            >
              {o.label}
              {o.value === value && <Check size={13} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn btn-sm btn-ghost" onClick={onClick}>
      <X size={13} />Clear
    </button>
  );
}
