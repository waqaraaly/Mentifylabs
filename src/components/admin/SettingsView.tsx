"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ui/ToastProvider";
import { changePasswordAction, saveAccountAction } from "@/app/admin/settings/actions";

function Section({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return (
    <section className="card" style={{ overflow: "hidden" }}>
      <div className="card-head" style={{ alignItems: "flex-start", flexDirection: "column", gap: 2 }}>
        <div className="h2">{title}</div>
        <div style={{ fontSize: 13, color: "var(--ml-ink-muted)" }}>{description}</div>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, borderTop: "1px solid var(--ml-border-soft)" }}>
        {children}
      </div>
      <div style={{ padding: "14px 20px", background: "var(--ml-surface-2)", borderTop: "1px solid var(--ml-border-soft)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        {footer}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ml-ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}

export function SettingsView({ account }: { account: { name: string; email: string; pendingEmail: string | null } }) {
  const addToast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const saveAccount = () => startTransition(async () => {
    const r = await saveAccountAction({ name, email });
    addToast(r.message, r.ok ? "ok" : "danger");
    if (r.ok) router.refresh();
  });

  const changePassword = () => startTransition(async () => {
    const r = await changePasswordAction(pw.current, pw.next, pw.confirm);
    addToast(r.message, r.ok ? "ok" : "danger");
    if (r.ok) setPw({ current: "", next: "", confirm: "" });
  });

  return (
    <div style={{ padding: "0 32px 40px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <Section
        title="Account"
        description="How you appear in the portal."
        footer={<button className="btn btn-primary" disabled={pending} onClick={saveAccount}>Save account</button>}
      >
        <Field label="Name">
          <input className="input input-plain" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input input-plain" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {account.pendingEmail && (
            <span style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", lineHeight: 1.5 }}>
              Waiting for you to confirm <strong>{account.pendingEmail}</strong>. Until then you sign in with {account.email}. Save again to resend the link.
            </span>
          )}
        </Field>
      </Section>

      <Section
        title="Password"
        description="Use at least 8 characters."
        footer={
          <button className="btn btn-primary" disabled={pending || !pw.current || !pw.next || !pw.confirm} onClick={changePassword}>
            Update password
          </button>
        }
      >
        <Field label="Current password">
          <input className="input input-plain" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        </Field>
        <Field label="New password">
          <input className="input input-plain" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        </Field>
        <Field label="Confirm new password">
          <input className="input input-plain" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        </Field>
      </Section>
    </div>
  );
}
