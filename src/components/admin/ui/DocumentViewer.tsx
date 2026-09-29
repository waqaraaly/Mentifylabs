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
        background: "var(--ml-surface)", borderRadius: 12, boxShadow: "var(--ml-shadow-lg)",
        zIndex: 61, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--ml-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Avatar name={personName} size="sm" />
            <div style={{ minWidth: 0 }}>
              <div className="h2" style={{ fontSize: 14 }}>{personName}&apos;s documents</div>
              <div style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)" }}>{docs.length} files uploaded for verification</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {active.hasFile ? (
              <a className="btn btn-sm" href={`/documents/${active.id}?download=1`}><Download size={13} />Download</a>
            ) : (
              <button className="btn btn-sm" onClick={() => addToast("This demo record has no file attached", "info")}><Download size={13} />Download</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div style={{ width: 240, borderRight: "1px solid var(--ml-border)", background: "var(--ml-surface-2)", overflowY: "auto", padding: 8 }}>
            {docs.map((d) => (
              <div key={d.id} onClick={() => onSelect(d)} style={{
                padding: "9px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
                background: active.id === d.id ? "var(--ml-surface)" : "transparent",
                boxShadow: active.id === d.id ? "var(--ml-shadow)" : "none",
                display: "flex", gap: 9, alignItems: "center",
              }}>
                <FileText size={15} style={{ color: active.id === d.id ? "var(--ml-accent)" : "var(--ml-ink-subtle)", flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }} className="truncate">{d.category}</div>
                  <div className="mono truncate" style={{ fontSize: 10.5, color: "var(--ml-ink-subtle)" }}>{d.name}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0, background: "var(--ml-bg-alt)", display: "flex" }}>
            {!active.hasFile ? (
              <div style={{ margin: "auto", textAlign: "center", maxWidth: 320, padding: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid var(--ml-border)", display: "grid", placeItems: "center", color: "var(--ml-ink-subtle)", margin: "0 auto 12px" }}>
                  <Shield size={22} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{active.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginTop: 6, lineHeight: 1.6 }}>
                  Demo record with no file attached. Files {personName} uploads from their Settings page appear here.
                </div>
              </div>
            ) : active.contentType?.startsWith("image/") ? (
              <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- private, access-checked file; not optimizable */}
                <img src={`/documents/${active.id}`} alt={active.name} style={{ maxWidth: "100%", boxShadow: "0 4px 18px rgba(20,20,18,.12)", background: "#fff" }} />
              </div>
            ) : (
              <iframe key={active.id} src={`/documents/${active.id}`} title={active.name} style={{ flex: 1, border: 0, background: "#fff" }} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
