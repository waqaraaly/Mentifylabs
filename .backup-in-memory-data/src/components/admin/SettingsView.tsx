"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AdminSettings } from "@/data/adminSettings";
import { useToast } from "./ui/ToastProvider";
import { changePasswordAction, saveAccountAction, savePreferencesAction } from "@/app/admin/settings/actions";

function Section({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return (
    <section className="card" style={{ overflow: "hidden" }}>
      <div className="card-head" style={{ alignItems: "flex-start", flexDirection: "column", gap: 2 }}>
        <div className="h2">{title}</div>
        <div style={{ fontSize: 13, color: "var(--zf-ink-muted)" }}>{description}</div>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, borderTop: "1px solid var(--zf-border-soft)" }}>
        {children}
      </div>
      <div style={{ padding: "14px 20px", background: "var(--zf-surface-2)", borderTop: "1px solid var(--zf-border-soft)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        {footer}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--zf-ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, title, description }: { checked: boolean; onChange: (v: boolean) => void; title: string; description: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer" }}>
      <span>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 500 }}>{title}</span>
        <span style={{ display: "block", fontSize: 12.5, color: "var(--zf-ink-muted)", marginTop: 2 }}>{description}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="switch" />
    </label>
  );
}

export function SettingsView({ settings }: { settings: AdminSettings }) {
  const addToast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [prefs, setPrefs] = useState({
    skipVerificationByDefault: settings.skipVerificationByDefault,
    notifyNewSignup: settings.notifyNewSignup,
    notifyProfileSubmitted: settings.notifyProfileSubmitted,
    notifyDailyDigest: settings.notifyDailyDigest,
  });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const saveAccount = () => startTransition(async () => {
    const r = await saveAccountAction({ name, email });
    addToast(r.message, r.ok ? "ok" : "danger");
    if (r.ok) router.refresh();
  });

  const savePrefs = () => startTransition(async () => {
    const r = await savePreferencesAction(prefs);
    addToast(r.message, "ok");
    router.refresh();
  });

  const changePassword = () => startTransition(async () => {
    const r = await changePasswordAction(pw.current, pw.next, pw.confirm);
    addToast(r.message, r.ok ? "ok" : "danger");
    if (r.ok) setPw({ current: "", next: "", confirm: "" });
  });

  const setPref = (key: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [key]: v }));

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

      <Section
        title="Preferences"
        description="Defaults for adding practitioners and which alerts you want."
        footer={
          <>
            <span style={{ fontSize: 12, color: "var(--zf-ink-subtle)", marginRight: "auto" }}>
              Email delivery isn&apos;t connected yet, so alert choices are saved but nothing is sent.
            </span>
            <button className="btn btn-primary" disabled={pending} onClick={savePrefs}>Save preferences</button>
          </>
        }
      >
        <Toggle
          checked={prefs.skipVerificationByDefault}
          onChange={setPref("skipVerificationByDefault")}
          title="Skip verification when adding practitioners"
          description="Pre-ticks “grant immediate access” in the Add practitioner form."
        />
        <div className="divider" />
        <Toggle checked={prefs.notifyNewSignup} onChange={setPref("notifyNewSignup")} title="New practitioner sign-up" description="When someone applies to join." />
        <Toggle checked={prefs.notifyProfileSubmitted} onChange={setPref("notifyProfileSubmitted")} title="Profile submitted for review" description="When a practitioner sends their profile for approval." />
        <Toggle checked={prefs.notifyDailyDigest} onChange={setPref("notifyDailyDigest")} title="Daily summary" description="One email each morning with bookings and pending items." />
      </Section>
    </div>
  );
}
