"use client";

import { Search, Filter, ChevronDown, X } from "lucide-react";

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
      <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: "var(--zf-ink-subtle)" }} />
      <input
        className="input"
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
  return (
    <div style={{ position: "relative" }}>
      <Filter size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--zf-ink-subtle)", pointerEvents: "none" }} />
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingLeft: 30, paddingRight: 28, width, appearance: "none", cursor: "pointer" }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} style={{ position: "absolute", right: 10, top: 11, color: "var(--zf-ink-subtle)", pointerEvents: "none" }} />
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
