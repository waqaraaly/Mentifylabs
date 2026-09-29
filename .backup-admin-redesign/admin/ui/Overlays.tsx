"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Drawer({
  open,
  onClose,
  width = 720,
  children,
}: {
  open: boolean;
  onClose: () => void;
  width?: number;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" style={{ width }}>{children}</div>
    </>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} style={{ zIndex: 60 }} />
      <div
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width, maxWidth: "calc(100vw - 32px)", background: "var(--zf-surface)",
          borderRadius: 12, boxShadow: "var(--zf-shadow-lg)",
          zIndex: 61, display: "flex", flexDirection: "column", maxHeight: "85vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--zf-border)" }}>
          <div className="h2">{title}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        <div style={{ padding: 18, overflow: "auto" }}>{children}</div>
        {footer && (
          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--zf-border)", display: "flex", justifyContent: "flex-end", gap: 8, background: "var(--zf-surface-2)" }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

export interface ConfirmConfig {
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  action: () => void;
}

export function ConfirmDialog({
  confirm,
  onCancel,
}: {
  confirm: ConfirmConfig | null;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={!!confirm}
      onClose={onCancel}
      title={confirm?.title ?? ""}
      width={420}
      footer={
        <>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button
            className={"btn " + (confirm?.danger ? "btn-danger" : "btn-primary")}
            onClick={() => { confirm?.action(); }}
          >
            {confirm?.confirmLabel ?? "Confirm"}
          </button>
        </>
      }
    >
      <div style={{ color: "var(--zf-ink-2)", lineHeight: 1.55, fontSize: 13.5 }}>{confirm?.body}</div>
    </Modal>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", gap: 8, color: "var(--zf-ink-muted)" }}>
      {icon && (
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--zf-surface-3)", display: "grid", placeItems: "center", color: "var(--zf-ink-subtle)" }}>
          {icon}
        </div>
      )}
      <div style={{ fontWeight: 500, color: "var(--zf-ink)", marginTop: 4 }}>{title}</div>
      {body && <div style={{ fontSize: 13, textAlign: "center", maxWidth: 340 }}>{body}</div>}
    </div>
  );
}

export function Field({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: ReactNode;
  mono?: boolean;
  children?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 0", borderBottom: "1px solid var(--zf-border-soft)" }}>
      <div className="label">{label}</div>
      <div className={mono ? "mono" : ""} style={{ fontSize: 13.5, color: "var(--zf-ink)", wordBreak: "break-word" }}>
        {children ?? value ?? <span className="subtle">—</span>}
      </div>
    </div>
  );
}
