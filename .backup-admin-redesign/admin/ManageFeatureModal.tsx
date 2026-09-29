"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Plus, Users, X } from "lucide-react";
import type { Feature } from "@/types/feature";
import type { Practitioner } from "@/types/practitioner";
import { Avatar } from "./ui/Avatar";
import { Modal } from "./ui/Overlays";
import { useToast } from "./ui/ToastProvider";
import {
  enableFeatureForAllAction, disableFeatureForAllAction,
  grantFeatureAction, revokeFeatureAction,
} from "@/app/admin/actions";

export function ManageFeatureModal({
  feature,
  practitioners,
  accessSlugs,
  onClose,
}: {
  feature: Feature | null;
  practitioners: Practitioner[];
  accessSlugs: string[];
  onClose: () => void;
}) {
  // Mounting only while a feature is selected gives the form fresh state
  // each time, without an effect-based reset. The key guards against
  // switching directly from one feature to another.
  return feature ? (
    <ManageFeatureModalForm key={feature.id} feature={feature} practitioners={practitioners} accessSlugs={accessSlugs} onClose={onClose} />
  ) : null;
}

function ManageFeatureModalForm({
  feature,
  practitioners,
  accessSlugs,
  onClose,
}: {
  feature: Feature;
  practitioners: Practitioner[];
  accessSlugs: string[];
  onClose: () => void;
}) {
  const activeP = practitioners.filter((p) => p.status === "active");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const hasAccess = activeP.filter((p) => accessSlugs.includes(p.slug));
  const allSelected = hasAccess.length > 0 && selected.length === hasAccess.length;

  const toggleSelect = (slug: string) => setSelected((s) => s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]);
  const toggleSelectAll = () => setSelected(allSelected ? [] : hasAccess.map((p) => p.slug));

  const revoke = (slug: string, name: string) => startTransition(async () => {
    await revokeFeatureAction(slug, feature.id);
    addToast("Access removed for " + name, "info");
    router.refresh();
  });

  const bulkRevoke = () => startTransition(async () => {
    await Promise.all(selected.map((slug) => revokeFeatureAction(slug, feature.id)));
    addToast(selected.length + " practitioners' access revoked", "danger");
    setSelected([]);
    router.refresh();
  });

  const shareAll = () => startTransition(async () => {
    await enableFeatureForAllAction(feature.id);
    addToast("Shared with all " + activeP.length + " active practitioners", "ok");
    router.refresh();
  });

  const disableAll = () => startTransition(async () => {
    await disableFeatureForAllAction(feature.id);
    addToast("Disabled for all practitioners", "info");
    router.refresh();
  });

  const addByEmail = () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    const match = activeP.find((p) => p.email.toLowerCase() === e);
    if (!match) { addToast("No active practitioner with that email", "danger"); return; }
    if (accessSlugs.includes(match.slug)) { addToast(match.fullName + " already has access", "info"); setEmail(""); return; }
    startTransition(async () => {
      await grantFeatureAction(match.slug, feature.id);
      addToast("Access granted to " + match.fullName, "ok");
      setEmail("");
      router.refresh();
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Manage — ${feature.name}`}
      width={520}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 13, color: "var(--zf-ink-muted)", lineHeight: 1.5 }}>
          Manage which practitioners can use <strong style={{ color: "var(--zf-ink)" }}>{feature.name}</strong>.
        </div>

        <div>
          <div className="label" style={{ marginBottom: 8 }}>Grant access</div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Mail size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--zf-ink-subtle)" }} />
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addByEmail(); }}
                placeholder="Add a practitioner by email…"
                style={{ paddingLeft: 32 }}
              />
            </div>
            <button className="btn" disabled={pending} onClick={addByEmail}><Plus size={14} />Add</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button className="btn btn-sm" disabled={pending} onClick={shareAll}>
              <Users size={14} />Share with all practitioners ({activeP.length})
            </button>
            <button className="btn btn-sm btn-ghost" disabled={pending} onClick={disableAll}>
              <X size={13} />Disable for all
            </button>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="label">Has access</div>
              <span className="tnum" style={{ fontSize: 12, color: "var(--zf-ink-subtle)" }}>{hasAccess.length} of {activeP.length}</span>
            </div>
            {selected.length > 0 && (
              <button className="btn btn-sm btn-danger" disabled={pending} onClick={bulkRevoke}>
                <X size={12} />Revoke selected ({selected.length})
              </button>
            )}
          </div>
          {hasAccess.length === 0 ? (
            <div style={{ padding: "18px 12px", textAlign: "center", fontSize: 12.5, color: "var(--zf-ink-subtle)", border: "1px dashed var(--zf-border-strong)", borderRadius: 8 }}>
              No one has access yet. Add a practitioner by email or share with all.
            </div>
          ) : (
            <div style={{ border: "1px solid var(--zf-border)", borderRadius: 8, overflow: "hidden", maxHeight: 240, overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--zf-surface-2)", borderBottom: "1px solid var(--zf-border)" }}>
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ accentColor: "var(--zf-accent)", cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: "var(--zf-ink-muted)" }}>Select all</span>
              </div>
              {hasAccess.map((p, i) => (
                <div key={p.slug} onClick={() => toggleSelect(p.slug)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderBottom: i === hasAccess.length - 1 ? "none" : "1px solid var(--zf-border-soft)",
                  background: selected.includes(p.slug) ? "var(--zf-accent-tint)" : "transparent", cursor: "pointer",
                }}>
                  <input type="checkbox" checked={selected.includes(p.slug)} onChange={() => toggleSelect(p.slug)} onClick={(e) => e.stopPropagation()} style={{ accentColor: "var(--zf-accent)", cursor: "pointer" }} />
                  <Avatar name={p.fullName} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{p.fullName}</div>
                    <div className="mono truncate" style={{ fontSize: 11, color: "var(--zf-ink-subtle)" }}>{p.email}</div>
                  </div>
                  <button className="btn btn-sm btn-danger" disabled={pending} onClick={(e) => { e.stopPropagation(); revoke(p.slug, p.fullName); }}>
                    <X size={12} />Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
