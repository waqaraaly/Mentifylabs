"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, UserPlus } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { SearchInput } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { AddPractitionerModal } from "./AddPractitionerModal";
import { TopBar } from "./TopBar";

const isIncomplete = (p: Practitioner) => ["incomplete", "draft"].includes(p.profileStatus);

export function PractitionersView({
  practitioners,
  defaultSkipVerification,
}: {
  practitioners: Practitioner[];
  defaultSkipVerification: boolean;
}) {
  const [statusTab, setStatusTab] = useState("all");
  const [q, setQ] = useState("");
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(() => ({
    all: practitioners.length,
    active: practitioners.filter((p) => p.status === "active").length,
    pending: practitioners.filter((p) => p.status === "pending").length,
    suspended: practitioners.filter((p) => p.status === "suspended").length,
    incomplete: practitioners.filter(isIncomplete).length,
  }), [practitioners]);

  const filtered = practitioners
    .filter((p) => statusTab === "all" ? true : statusTab === "incomplete" ? isIncomplete(p) : p.status === statusTab)
    .filter((p) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return p.fullName.toLowerCase().includes(s) || p.email.toLowerCase().includes(s) || p.professionalTitle.toLowerCase().includes(s);
    });

  return (
    <div>
      <TopBar
        title="Practitioners"
        subtitle="All registered practitioners across the platform"
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setAddOpen(true)}>
            <UserPlus size={13} />Add practitioner
          </button>
        }
      />

      <div style={{ padding: "0 32px 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--zf-border)", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="h2" style={{ fontSize: 15 }}>All practitioners</div>
              <div style={{ fontSize: 12, color: "var(--zf-ink-subtle)", marginTop: 1 }}>
                <span className="tnum">{filtered.length}</span> of <span className="tnum">{counts.all}</span> shown
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <SearchInput value={q} onChange={setQ} placeholder="Search by name, email, title…" width={260} />
              <select
                className="input"
                value={statusTab}
                onChange={(e) => setStatusTab(e.target.value)}
                style={{ paddingLeft: 12, width: 190, cursor: "pointer" }}
              >
                <option value="all">All statuses ({counts.all})</option>
                <option value="active">Active ({counts.active})</option>
                <option value="pending">Pending ({counts.pending})</option>
                <option value="incomplete">Incomplete ({counts.incomplete})</option>
                <option value="suspended">Suspended ({counts.suspended})</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No practitioners match" body="Try a different status or search term." />
          ) : (
            <div className="table-scroll">
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
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={p.fullName} size="md" />
                            <span style={{ fontWeight: 500, color: "var(--zf-ink)" }}>{p.fullName}</span>
                          </div>
                        </td>
                        <td className="hide-md">{p.professionalTitle}</td>
                        <td className="hide-sm mono" style={{ fontSize: 12.5, color: "var(--zf-ink-muted)" }}>{p.email}</td>
                        <td>{isIncomplete(p) ? <Badge kind="incomplete" /> : <Badge kind={p.status} />}</td>
                        <td style={{ textAlign: "right", paddingRight: 18 }} onClick={(e) => e.stopPropagation()}>
                          <Link className="btn btn-sm" href={`/admin/practitioners/${p.slug}`}><Eye size={13} />View</Link>
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

      <AddPractitionerModal open={addOpen} onClose={() => setAddOpen(false)} defaultSkipVerification={defaultSkipVerification} />
    </div>
  );
}
