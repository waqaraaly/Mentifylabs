"use client";

import { useMemo, useState } from "react";
import { Settings } from "lucide-react";
import type { Feature, FeatureAccessLog } from "@/types/feature";
import type { Practitioner } from "@/types/practitioner";
import { Badge } from "./ui/Badge";
import { SearchInput, FilterSelect, ClearFiltersButton } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { ManageFeatureModal } from "./ManageFeatureModal";
import { FeatureIcon } from "./featureIcons";
import { TopBar } from "./TopBar";

const ACTION_META: Record<string, { label: string; kind: string }> = {
  granted: { label: "Granted", kind: "active" },
  revoked: { label: "Revoked", kind: "suspended" },
  enabled_all: { label: "Enabled for all", kind: "info" },
  disabled_all: { label: "Disabled for all", kind: "pending" },
};

export function FeaturesView({
  features,
  practitioners,
  accessByFeature,
  logs,
}: {
  features: Feature[];
  practitioners: Practitioner[];
  accessByFeature: Record<string, string[]>;
  logs: FeatureAccessLog[];
}) {
  const [q, setQ] = useState("");
  const [manageId, setManageId] = useState<string | null>(null);
  const [logQ, setLogQ] = useState("");
  const [logAction, setLogAction] = useState("all");

  const filtered = features.filter((f) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return f.name.toLowerCase().includes(s) || f.description.toLowerCase().includes(s) || f.category.toLowerCase().includes(s);
  });

  const bySlug = useMemo(() => new Map(practitioners.map((p) => [p.slug, p.fullName])), [practitioners]);

  const filteredLogs = logs.filter((l) => {
    if (logAction !== "all" && l.action !== logAction) return false;
    if (logQ) {
      const s = logQ.toLowerCase();
      const feature = features.find((f) => f.id === l.featureId);
      const name = l.practitionerSlug ? bySlug.get(l.practitionerSlug) ?? l.practitionerSlug : "All practitioners";
      if (!feature?.name.toLowerCase().includes(s) && !name.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const manageFeature = features.find((f) => f.id === manageId) ?? null;

  return (
    <div>
      <TopBar title="Feature Library" subtitle="This section manages all platform features" />

      <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--zf-border)", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="h2" style={{ fontSize: 15 }}>All features</div>
              <div style={{ fontSize: 12, color: "var(--zf-ink-subtle)", marginTop: 1 }}>Control which practitioners can access which features.</div>
            </div>
            <SearchInput value={q} onChange={setQ} placeholder="Search features…" width={240} />
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No features match" body="Try a different search term." />
          ) : (
            <table className="table" style={{ border: "none" }}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="hide-md">Category</th>
                  <th className="hide-sm">Status</th>
                  <th className="hide-lg">Plan</th>
                  <th>Access</th>
                  <th style={{ width: 100, textAlign: "right", paddingRight: 18 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const access = accessByFeature[f.id] ?? [];
                  return (
                    <tr key={f.id} style={{ cursor: "default" }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--zf-accent-tint)", display: "grid", placeItems: "center", color: "var(--zf-accent)", flexShrink: 0 }}>
                            <FeatureIcon name={f.icon} size={16} />
                          </div>
                          <div style={{ minWidth: 0, maxWidth: 320 }}>
                            <div style={{ fontWeight: 500, color: "var(--zf-ink)" }}>{f.name}</div>
                            <div className="truncate" style={{ fontSize: 12, color: "var(--zf-ink-muted)" }}>{f.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hide-md" style={{ fontSize: 12.5, color: "var(--zf-ink-muted)" }}>{f.category}</td>
                      <td className="hide-sm"><Badge kind={f.status} /></td>
                      <td className="hide-lg" style={{ fontSize: 12.5, color: "var(--zf-ink-muted)" }}>{f.plan}</td>
                      <td className="tnum" style={{ fontSize: 12.5 }}>{access.length} of {practitioners.filter((p) => p.status === "active").length}</td>
                      <td style={{ textAlign: "right", paddingRight: 18 }}>
                        <button className="btn btn-sm" onClick={() => setManageId(f.id)}><Settings size={13} />Manage</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--zf-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="h2" style={{ fontSize: 15 }}>Access history</div>
              <div style={{ fontSize: 12, color: "var(--zf-ink-subtle)", marginTop: 1 }}>Log of all feature access changes</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <SearchInput value={logQ} onChange={setLogQ} placeholder="Search feature or practitioner…" width={240} />
              <FilterSelect
                value={logAction}
                onChange={setLogAction}
                options={[
                  { value: "all", label: "All actions" },
                  { value: "granted", label: "Granted" },
                  { value: "revoked", label: "Revoked" },
                  { value: "enabled_all", label: "Enabled for all" },
                  { value: "disabled_all", label: "Disabled for all" },
                ]}
                width={170}
              />
              {(logAction !== "all" || logQ) && <ClearFiltersButton onClick={() => { setLogAction("all"); setLogQ(""); }} />}
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <EmptyState title="No log entries match" body="Try adjusting your filters." />
          ) : (
            <table className="table" style={{ border: "none" }}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Practitioner</th>
                  <th style={{ width: 160 }}>Action</th>
                  <th style={{ width: 150 }}>Date &amp; time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => {
                  const feature = features.find((f) => f.id === l.featureId);
                  const meta = ACTION_META[l.action];
                  const name = l.practitionerSlug ? bySlug.get(l.practitionerSlug) ?? l.practitionerSlug : "All practitioners";
                  return (
                    <tr key={l.id} style={{ cursor: "default" }}>
                      <td style={{ fontWeight: 500 }}>{feature?.name ?? l.featureId}</td>
                      <td style={{ color: l.practitionerSlug ? "var(--zf-ink)" : "var(--zf-ink-muted)", fontStyle: l.practitionerSlug ? "normal" : "italic" }}>{name}</td>
                      <td><Badge kind={meta.kind}>{meta.label}</Badge></td>
                      <td className="mono tnum" style={{ fontSize: 12, color: "var(--zf-ink-muted)" }}>{l.at.slice(0, 16).replace("T", " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ManageFeatureModal
        feature={manageFeature}
        practitioners={practitioners}
        accessSlugs={manageFeature ? accessByFeature[manageFeature.id] ?? [] : []}
        onClose={() => setManageId(null)}
      />
    </div>
  );
}
