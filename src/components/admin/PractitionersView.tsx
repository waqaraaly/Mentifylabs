"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Users } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import { Badge } from "./ui/Badge";
import { headlineKey } from "@/lib/practitionerState";
import { SearchInput, FilterSelect } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { AddPractitionerModal } from "./AddPractitionerModal";
import { TopBar } from "./TopBar";

export function PractitionersView({ practitioners }: { practitioners: Practitioner[] }) {
  const [statusFilter, setStatusFilter] = useState<"all" | Practitioner["status"]>("all");
  const [q, setQ] = useState("");
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(() => ({
    all: practitioners.length,
    active: practitioners.filter((p) => p.status === "active").length,
    suspended: practitioners.filter((p) => p.status === "suspended").length,
  }), [practitioners]);

  const filtered = practitioners
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter((p) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return p.fullName.toLowerCase().includes(s) || p.email.toLowerCase().includes(s) || p.professionalTitle.toLowerCase().includes(s);
    });

  return (
    <div>
      <TopBar
        icon={Users}
        title="Practitioners"
        subtitle="All registered practitioners across the platform"
        actions={
          <button className="btn btn-lg btn-primary" onClick={() => setAddOpen(true)}>
            <UserPlus size={15} />Add practitioner
          </button>
        }
      />

      <div style={{ padding: "0 var(--ml-gutter) 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--ml-border)", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="h2" style={{ fontSize: 15 }}>All practitioners</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <SearchInput value={q} onChange={setQ} placeholder="Search by name, email, title…" width={260} />
              <FilterSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as typeof statusFilter)}
                options={[
                  { value: "all", label: `All statuses (${counts.all})` },
                  { value: "active", label: `Active (${counts.active})` },
                  { value: "suspended", label: `Suspended (${counts.suspended})` },
                ]}
                width={200}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No practitioners match" body="Try a different status or search term." />
          ) : (
            <div className="table-scroll scroll-y tall">
              <table className="table" style={{ border: "none" }}>
                <thead>
                  <tr>
                    <th>Practitioner</th>
                    <th className="hide-md">Professional title</th>
                    <th className="hide-sm">Email</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right", paddingRight: 18 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    return (
                      <tr key={p.slug} onClick={() => router.push(`/admin/practitioners/${p.slug}`)}>
                        <td>
                          <span style={{ fontWeight: 500, color: "var(--ml-ink)" }}>{p.fullName}</span>
                        </td>
                        <td className="hide-md">{p.professionalTitle}</td>
                        <td className="hide-sm mono" style={{ fontSize: 12.5, color: "var(--ml-ink-muted)" }}>{p.email}</td>
                        <td>
                          <Badge kind={p.status} />
                          {headlineKey(p) === "invite_not_sent" && <div style={{ fontSize: 11.5, color: "var(--ml-warn)", marginTop: 2 }}>Invite not sent</div>}
                        </td>
                        <td style={{ textAlign: "right", paddingRight: 18 }} onClick={(e) => e.stopPropagation()}>
                          <Link className="btn btn-lg btn-primary" href={`/admin/practitioners/${p.slug}`}>View</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddPractitionerModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
