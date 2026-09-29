"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Modal } from "./ui/Overlays";
import { useToast } from "./ui/ToastProvider";
import { createPractitionerAction } from "@/app/admin/actions";

export function AddPractitionerModal({ open, onClose, defaultSkipVerification = true }: { open: boolean; onClose: () => void; defaultSkipVerification?: boolean }) {
  // Mounting only while open gives the form fresh state each time it opens,
  // without an effect-based reset.
  return open ? <AddPractitionerModalForm onClose={onClose} defaultSkipVerification={defaultSkipVerification} /> : null;
}

function AddPractitionerModalForm({ onClose, defaultSkipVerification }: { onClose: () => void; defaultSkipVerification: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [skipVerification, setSkipVerification] = useState(defaultSkipVerification);
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const submit = () => {
    if (!name || !email) { addToast("Name and email required", "danger"); return; }
    startTransition(async () => {
      const result = await createPractitionerAction({
        fullName: name,
        email,
        professionalTitle: title,
        skipVerification,
      });
      if (!result.ok) { addToast(result.message, "danger"); return; }
      addToast(`${name} created` + (skipVerification ? " · access granted immediately" : ""), "ok");
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add practitioner manually"
      width={520}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={pending} onClick={submit}>
            <UserPlus size={13} />Create account
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: "var(--zf-ink-muted)", lineHeight: 1.5 }}>
          Manually create an account for a practitioner. They&apos;ll receive an invite email with a one-time password.
        </div>
        <FormField label="Full name *">
          <input className="input input-plain" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Riya Khanna" />
        </FormField>
        <FormField label="Email *">
          <input className="input input-plain" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </FormField>
        <FormField label="Professional title">
          <input className="input input-plain" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Clinical Psychologist" />
        </FormField>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, border: "1px solid var(--zf-border)", borderRadius: 8, background: "var(--zf-surface-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={skipVerification} onChange={(e) => setSkipVerification(e.target.checked)} style={{ accentColor: "var(--zf-accent)", marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Skip verification, grant immediate access</div>
          </div>
        </label>
      </div>
    </Modal>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--zf-ink-muted)", marginBottom: 4, fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}
