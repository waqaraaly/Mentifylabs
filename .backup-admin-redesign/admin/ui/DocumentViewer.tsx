"use client";

import { Download, FileText, Shield, X } from "lucide-react";
import type { PractitionerDocument } from "@/types/document";
import { Avatar } from "./Avatar";
import { useToast } from "./ToastProvider";

export function DocumentViewer({
  docs,
  active,
  onSelect,
  onClose,
  personName,
}: {
  docs: PractitionerDocument[];
  active: PractitionerDocument | null;
  onSelect: (d: PractitionerDocument) => void;
  onClose: () => void;
  personName: string;
}) {
  const addToast = useToast();
  if (!active) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} style={{ zIndex: 60 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 880, maxWidth: "calc(100vw - 48px)", height: 640, maxHeight: "calc(100vh - 48px)",
        background: "var(--zf-surface)", borderRadius: 12, boxShadow: "var(--zf-shadow-lg)",
        zIndex: 61, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--zf-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Avatar name={personName} size="sm" />
            <div style={{ minWidth: 0 }}>
              <div className="h2" style={{ fontSize: 14 }}>{personName}&apos;s documents</div>
              <div style={{ fontSize: 11.5, color: "var(--zf-ink-subtle)" }}>{docs.length} files uploaded for verification</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm" onClick={() => addToast("Downloading " + active.name, "info")}><Download size={13} />Download</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div style={{ width: 240, borderRight: "1px solid var(--zf-border)", background: "var(--zf-surface-2)", overflowY: "auto", padding: 8 }}>
            {docs.map((d) => (
              <div key={d.id} onClick={() => onSelect(d)} style={{
                padding: "9px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
                background: active.id === d.id ? "var(--zf-surface)" : "transparent",
                boxShadow: active.id === d.id ? "var(--zf-shadow)" : "none",
                display: "flex", gap: 9, alignItems: "center",
              }}>
                <FileText size={15} style={{ color: active.id === d.id ? "var(--zf-accent)" : "var(--zf-ink-subtle)", flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }} className="truncate">{d.category}</div>
                  <div className="mono truncate" style={{ fontSize: 10.5, color: "var(--zf-ink-subtle)" }}>{d.name}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto", background: "var(--zf-bg-alt)", padding: 24, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 520, minHeight: 540, background: "#fff", boxShadow: "0 4px 18px rgba(20,20,18,.12)", borderRadius: 4, padding: "40px 44px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid var(--zf-ink)", paddingBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--zf-ink-subtle)", textTransform: "uppercase" }}>{active.category}</div>
                  <div style={{ fontSize: 17, fontWeight: 600, marginTop: 4, maxWidth: 320 }}>{active.name}</div>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid var(--zf-accent)", display: "grid", placeItems: "center", color: "var(--zf-accent)" }}>
                  <Shield size={22} />
                </div>
              </div>
              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 11 }}>
                <div className="skel" style={{ height: 11, width: "82%" }} />
                <div className="skel" style={{ height: 11, width: "94%" }} />
                <div className="skel" style={{ height: 11, width: "70%" }} />
                <div style={{ height: 8 }} />
                <div style={{ fontSize: 12.5, color: "var(--zf-ink-muted)", lineHeight: 1.7 }}>
                  This certifies that <strong style={{ color: "var(--zf-ink)" }}>{personName}</strong> has been awarded the above document in recognition of completed requirements.
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 40, left: 44, right: 44, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ width: 120, borderBottom: "1px solid var(--zf-ink-faint)", marginBottom: 5 }} />
                  <div style={{ fontSize: 10.5, color: "var(--zf-ink-subtle)" }}>Authorized signatory</div>
                </div>
                <div className="mono" style={{ fontSize: 10, color: "var(--zf-ink-faint)" }}>Verified upload</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
