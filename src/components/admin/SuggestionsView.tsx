"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Lightbulb, Undo2 } from "lucide-react";
import type { Suggestion } from "@/data/suggestions";
import { setSuggestionStatusAction } from "@/app/admin/suggestions/actions";
import { SearchInput } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { TopBar } from "./TopBar";

type Filter = "all" | "new" | "reviewed";

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Everything practitioners have sent through the suggestion form, newest first, with a way to mark each one reviewed. */
export function SuggestionsView({ suggestions }: { suggestions: Suggestion[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const counts = { all: suggestions.length, new: suggestions.filter((s) => s.status === "new").length, reviewed: suggestions.filter((s) => s.status === "reviewed").length };
  const shown = suggestions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (!q) return true;
    const text = `${s.practitionerName} ${s.practitionerEmail} ${s.improve ?? ""} ${s.features ?? ""}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  const toggle = (s: Suggestion) =>
    startTransition(async () => {
      await setSuggestionStatusAction(s.id, s.status === "new" ? "reviewed" : "new");
      router.refresh();
    });

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "new", label: "New" },
    { id: "reviewed", label: "Reviewed" },
  ];

  return (
    <div>
      <TopBar icon={Lightbulb} title="Suggestions" subtitle="What practitioners say would make the platform better, and the features they would like." />

      <div style={{ padding: "0 var(--ml-gutter) 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 6 }} role="group" aria-label="Filter suggestions">
            {tabs.map((t) => (
              <button key={t.id} type="button" className={`btn btn-sm ${filter === t.id ? "btn-primary" : "btn-ghost"}`} aria-pressed={filter === t.id} onClick={() => setFilter(t.id)}>
                {t.label} <span style={{ opacity: 0.7 }}>{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <SearchInput value={q} onChange={setQ} placeholder="Search suggestions…" width={260} />
        </div>

        {shown.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Lightbulb size={18} />}
              title={suggestions.length === 0 ? "No suggestions yet" : "Nothing matches"}
              body={suggestions.length === 0 ? "Suggestions sent from the practitioner portal will appear here." : "Try another filter or search."}
            />
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {shown.map((s) => (
              <article key={s.id} className="card" style={{ padding: 20, opacity: pending ? 0.85 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <Link href={`/admin/practitioners/${s.practitionerSlug}`} style={{ fontWeight: 600, fontSize: 15 }}>
                        {s.practitionerName}
                      </Link>
                      {s.status === "new" && (
                        <span className="badge" style={{ color: "var(--ml-accent)", background: "color-mix(in srgb, var(--ml-accent) 12%, white)" }}>
                          <span className="badge-dot" />New
                        </span>
                      )}
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {s.practitionerTitle ? `${s.practitionerTitle} · ` : ""}
                      {s.practitionerEmail} · {when(s.createdAt)}
                    </div>
                  </div>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggle(s)} disabled={pending}>
                    {s.status === "new" ? (
                      <>
                        <Check size={13} />Mark reviewed
                      </>
                    ) : (
                      <>
                        <Undo2 size={13} />Mark as new
                      </>
                    )}
                  </button>
                </div>

                <div style={{ display: "grid", gap: 16, marginTop: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  {s.improve && (
                    <div>
                      <div className="label">How can we improve the platform?</div>
                      <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.6, fontSize: 14.5 }}>{s.improve}</p>
                    </div>
                  )}
                  {s.features && (
                    <div>
                      <div className="label">What new features would they like?</div>
                      <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.6, fontSize: 14.5 }}>{s.features}</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
