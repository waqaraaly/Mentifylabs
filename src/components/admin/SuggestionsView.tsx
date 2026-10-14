"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Lightbulb, Undo2 } from "lucide-react";
import type { Suggestion } from "@/data/suggestions";
import { setSuggestionStatusAction } from "@/app/admin/suggestions/actions";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { SearchInput } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { SlidingTabs } from "./ui/SlidingTabs";
import { KPIStrip } from "./ui/Stat";
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

  return (
    <div>
      <TopBar icon={Lightbulb} title="Suggestions" subtitle="What practitioners say would make the platform better, and the features they would like." />

      <div style={{ padding: "0 var(--ml-gutter) 32px", display: "grid", gap: 16 }}>
        <KPIStrip
          items={[
            { label: "Total received", value: counts.all },
            { label: "New", value: counts.new },
            { label: "Reviewed", value: counts.reviewed },
          ]}
        />

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "0 14px" }}>
            <SlidingTabs
              label="Filter suggestions"
              tabs={[
                { id: "all" as Filter, label: "All", count: counts.all },
                { id: "new" as Filter, label: "New", count: counts.new, attention: counts.new > 0 },
                { id: "reviewed" as Filter, label: "Reviewed", count: counts.reviewed },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--ml-border)", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "var(--ml-ink-muted)" }}>Newest first</div>
            {suggestions.length > 0 && <SearchInput value={q} onChange={setQ} placeholder="Search by name, email or text…" width={280} />}
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon={<Lightbulb size={18} />}
              title={suggestions.length === 0 ? "No suggestions yet" : "Nothing matches"}
              body={suggestions.length === 0 ? "Suggestions sent from the practitioner portal will appear here." : "Try another filter or search."}
            />
          ) : (
            <div style={{ opacity: pending ? 0.85 : 1 }}>
              {shown.map((s, i) => (
                <article key={s.id} style={{ padding: 20, borderTop: i === 0 ? "none" : "1px solid var(--ml-border)", display: "grid", gap: 16 }}>
                  <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <Avatar name={s.practitionerName} />
                      <div style={{ minWidth: 0 }}>
                        <Link href={`/admin/practitioners/${s.practitionerSlug}`} style={{ fontWeight: 600, fontSize: 15 }}>
                          {s.practitionerName}
                        </Link>
                        <div className="muted" style={{ fontSize: 13, marginTop: 2, overflowWrap: "anywhere" }}>
                          {s.practitionerTitle ? `${s.practitionerTitle} · ` : ""}
                          {s.practitionerEmail}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <time dateTime={s.createdAt} className="muted tnum" style={{ fontSize: 13 }}>{when(s.createdAt)}</time>
                      <Badge kind={s.status === "new" ? "pending" : "active"}>{s.status === "new" ? "New" : "Reviewed"}</Badge>
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
                  </header>

                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                    {[
                      { label: "How can we improve the platform?", text: s.improve },
                      { label: "What new features would they like?", text: s.features },
                    ]
                      .filter((f) => f.text)
                      .map((f) => (
                        <section key={f.label} style={{ background: "var(--ml-bg, rgba(0,0,0,0.025))", border: "1px solid var(--ml-border)", borderRadius: 10, padding: 14 }}>
                          <div className="label">{f.label}</div>
                          <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.6, fontSize: 14.5 }}>{f.text}</p>
                        </section>
                      ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
