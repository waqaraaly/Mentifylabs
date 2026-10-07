"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ui/ToastProvider";
import { changePasswordAction, disableTwoFactorAction, enableTwoFactorAction, requestTwoFactorCodeAction, saveAccountAction } from "@/app/admin/settings/actions";

type SectionId = "account" | "password" | "twoFactor";

const inputStyle = { maxWidth: 380 } as const;

/** A labelled input, stacked: the label above, the field below. */
function FormField({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ml-ink-2)" }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ml-ink-muted)" }}>{hint}</span>}
    </label>
  );
}

/**
 * One line of the page: what the setting is and its current state on the left, the button that opens it on the right.
 * Opening it reveals its form underneath, in place; only one is open at a time.
 */
function Section({
  title,
  summary,
  actionLabel,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: ReactNode;
  actionLabel: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section style={{ borderBottom: "1px solid var(--ml-border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "24px 0", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <div className="h2">{title}</div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ml-ink-muted)", marginTop: 4 }}>{summary}</div>
        </div>
        <button className="btn" aria-expanded={open} onClick={onToggle}>{open ? "Close" : actionLabel}</button>
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "4px 0 28px" }}>
          {children}
        </div>
      )}
    </section>
  );
}

export function SettingsView({ account, twoFactorEnabled }: { account: { name: string; email: string; pendingEmail: string | null }; twoFactorEnabled: boolean }) {
  const addToast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<SectionId | null>(null);

  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  // Changing the sign-in email takes the current password, so a borrowed session can't redirect the account.
  const [emailPassword, setEmailPassword] = useState("");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  // Two-step sign-in: nothing is asked until a code has been emailed, then the code (and, to turn it off, the password).
  const [codeSent, setCodeSent] = useState(false);
  const [tf, setTf] = useState({ code: "", password: "" });

  /** Opens a section, or closes it if it is already open. Whatever was half-typed is dropped. */
  const toggle = (id: SectionId) => {
    setOpen((current) => (current === id ? null : id));
    setName(account.name);
    setEmail(account.email);
    setEmailPassword("");
    setPw({ current: "", next: "", confirm: "" });
    setCodeSent(false);
    setTf({ code: "", password: "" });
  };

  const saveAccount = () => startTransition(async () => {
    const r = await saveAccountAction({ name, email, currentPassword: emailPassword });
    addToast(r.message, r.ok ? "ok" : "danger");
    if (r.ok) {
      setOpen(null);
      router.refresh();
    }
  });

  const changePassword = () => startTransition(async () => {
    const r = await changePasswordAction(pw.current, pw.next, pw.confirm);
    addToast(r.message, r.ok ? "ok" : "danger");
    if (r.ok) {
      setPw({ current: "", next: "", confirm: "" });
      setOpen(null);
    }
  });

  const sendCode = () => startTransition(async () => {
    const r = await requestTwoFactorCodeAction(twoFactorEnabled ? "disable" : "enable");
    addToast(r.message, r.ok ? "ok" : "danger");
    if (r.ok) setCodeSent(true);
  });

  const confirmTwoFactor = () => startTransition(async () => {
    const r = twoFactorEnabled ? await disableTwoFactorAction(tf.password, tf.code) : await enableTwoFactorAction(tf.code);
    addToast(r.message, r.ok ? "ok" : "danger");
    if (r.ok) {
      setCodeSent(false);
      setTf({ code: "", password: "" });
      setOpen(null);
      router.refresh();
    }
  });

  const accountChanged = name.trim() !== account.name || email.trim() !== account.email;

  return (
    <div style={{ padding: "0 var(--ml-gutter) 48px", maxWidth: 820 }}>
      {/* Who is signed in, and the one fact about their security worth seeing without opening anything */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0 28px", borderBottom: "1px solid var(--ml-border)", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 240px" }}>
          <div className="truncate" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--ml-ink)" }}>{account.name}</div>
          <div className="truncate" style={{ fontSize: 14.5, color: "var(--ml-ink-muted)", marginTop: 2 }}>{account.email}</div>
        </div>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
            background: twoFactorEnabled ? "var(--ml-ok-bg)" : "var(--ml-neutral-bg)",
            color: twoFactorEnabled ? "var(--ml-ok)" : "var(--ml-ink-muted)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "currentColor" }} />
          Two-step sign-in {twoFactorEnabled ? "on" : "off"}
        </span>
      </div>

      <Section
        title="Account"
        summary="Your name, and the email you sign in with."
        actionLabel="Edit details"
        open={open === "account"}
        onToggle={() => toggle("account")}
      >
        <FormField label="Name">
          <input className="input input-plain" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField
          label="Email"
          hint={
            account.pendingEmail
              ? <>Waiting for you to confirm <strong>{account.pendingEmail}</strong>. Until then you sign in with {account.email}. Save again to resend the link.</>
              : "Your sign-in codes are sent here too. A new address has to be confirmed from a link we email to it."
          }
        >
          <input className="input input-plain" style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        {email.trim().toLowerCase() !== account.email.toLowerCase() && (
          <FormField label="Current password" hint="Needed to change the email you sign in with.">
            <input className="input input-plain" style={inputStyle} type="password" autoComplete="current-password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
          </FormField>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" disabled={pending || !accountChanged} onClick={saveAccount}>Save changes</button>
          <button className="btn" disabled={pending} onClick={() => toggle("account")}>Cancel</button>
        </div>
      </Section>

      <Section
        title="Password"
        summary="Choose a new password. It signs you out of your other devices."
        actionLabel="Change password"
        open={open === "password"}
        onToggle={() => toggle("password")}
      >
        <FormField label="Current password">
          <input className="input input-plain" style={inputStyle} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        </FormField>
        <FormField label="New password" hint="At least 8 characters.">
          <input className="input input-plain" style={inputStyle} type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        </FormField>
        <FormField label="Confirm new password">
          <input className="input input-plain" style={inputStyle} type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        </FormField>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" disabled={pending || !pw.current || !pw.next || !pw.confirm} onClick={changePassword}>Update password</button>
          <button className="btn" disabled={pending} onClick={() => toggle("password")}>Cancel</button>
        </div>
      </Section>

      <Section
        title="Two-step sign-in"
        summary={
          twoFactorEnabled
            ? "On. After your password, a code sent to your email is needed to sign in."
            : "Off. Turn it on to also ask for a code sent to your email every time you sign in."
        }
        actionLabel={twoFactorEnabled ? "Turn off" : "Turn on"}
        open={open === "twoFactor"}
        onToggle={() => toggle("twoFactor")}
      >
        {!codeSent ? (
          <>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ml-ink-muted)", maxWidth: 520 }}>
              {twoFactorEnabled
                ? <>To turn it off we&apos;ll email a code to <strong>{account.email}</strong>, and you&apos;ll also enter your password.</>
                : <>We&apos;ll email a code to <strong>{account.email}</strong> to confirm you can receive it. Turning it on signs you out of your other devices.</>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" disabled={pending} onClick={sendCode}>Email me a code</button>
              <button className="btn" disabled={pending} onClick={() => toggle("twoFactor")}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            {twoFactorEnabled && (
              <FormField label="Your password">
                <input className="input input-plain" style={inputStyle} type="password" autoComplete="current-password" value={tf.password} onChange={(e) => setTf({ ...tf, password: e.target.value })} />
              </FormField>
            )}
            <FormField label="Code from the email" hint="6 digits. It works once and expires in 10 minutes.">
              <input className="input input-plain" style={inputStyle} inputMode="numeric" autoComplete="one-time-code" maxLength={9} value={tf.code} onChange={(e) => setTf({ ...tf, code: e.target.value })} />
            </FormField>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" disabled={pending || !tf.code || (twoFactorEnabled && !tf.password)} onClick={confirmTwoFactor}>
                {twoFactorEnabled ? "Turn off two-step sign-in" : "Turn on two-step sign-in"}
              </button>
              <button className="btn" disabled={pending} onClick={sendCode}>Send a new code</button>
              <button className="btn" disabled={pending} onClick={() => toggle("twoFactor")}>Cancel</button>
            </div>
          </>
        )}
      </Section>
    </div>
  );
}
