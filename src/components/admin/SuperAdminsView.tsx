"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2, UserPlus, UserCog } from "lucide-react";
import type { AdminUser } from "@/data/users";
import { SearchInput } from "./ui/Inputs";
import { EmptyState, Modal, ConfirmDialog, type ConfirmConfig } from "./ui/Overlays";
import { useToast } from "./ui/ToastProvider";
import { TopBar } from "./TopBar";
import { createAdminUserAction, deleteUserAction, sendAdminLinkAction } from "@/app/admin/super-admins/actions";

export function SuperAdminsView({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const filtered = users
    .filter((u) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    });

  const runAction = (fn: () => Promise<{ ok: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await fn();
      addToast(result.message, result.ok ? "ok" : "danger");
      if (result.ok) router.refresh();
    });
  };

  return (
    <div>
      <TopBar
        icon={UserCog}
        title="Super Admins"
        subtitle="The people who can sign in to this admin portal."
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setAddOpen(true)}>
            <UserPlus size={13} />Add Super Admin
          </button>
        }
      />

      <div style={{ padding: "0 var(--ml-gutter) 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--ml-border)", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="h2" style={{ fontSize: 15 }}>All Super Admins</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <SearchInput value={q} onChange={setQ} placeholder="Search by name or email…" width={260} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No Super Admins match" body="Try a different name or email." />
          ) : (
            <div className="table-scroll scroll-y">
              <table className="table" style={{ border: "none" }}>
                <thead>
                  <tr>
                    <th>Full name</th>
                    <th className="hide-sm">Email</th>
                    <th className="hide-md">Joined</th>
                    <th style={{ textAlign: "right", paddingRight: 18 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isSelf = u.id === currentUserId;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontWeight: 500, color: "var(--ml-ink)" }}>{u.name || "—"}</span>
                            {isSelf && <span className="badge" style={{ color: "var(--ml-info)", background: "var(--ml-info-bg)" }}>You</span>}
                          </div>
                        </td>
                        <td className="hide-sm mono" style={{ fontSize: 13.75, color: "var(--ml-ink-muted)" }}>{u.email}</td>
                        <td className="hide-md mono tnum" style={{ fontSize: 13.75, color: "var(--ml-ink-subtle)" }}>
                          {u.createdAt.slice(0, 10)}
                        </td>
                        <td style={{ textAlign: "right", paddingRight: 18 }}>
                          {isSelf ? (
                            <span className="subtle" style={{ fontSize: 13.75 }}>—</span>
                          ) : (
                            <div style={{ display: "inline-flex", gap: 6 }}>
                              <button
                                className="btn btn-sm"
                                disabled={pending}
                                onClick={() => startTransition(async () => {
                                  const result = await sendAdminLinkAction(u.id);
                                  if (!result.ok) { addToast(result.message, "danger"); return; }
                                  let copied = false;
                                  try { await navigator.clipboard.writeText(result.link); copied = true; } catch { /* the message still says what happened */ }
                                  addToast(
                                    (result.emailed ? `Link emailed to ${result.email}` : "Email isn't set up, so nothing was sent") + (copied ? ". Link copied to your clipboard." : "."),
                                    result.emailed ? "ok" : "info",
                                  );
                                })}
                              >
                                <KeyRound size={13} />Send password link
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                disabled={pending}
                                onClick={() =>
                                  setConfirm({
                                    title: "Delete this account permanently?",
                                    body: `This permanently removes ${u.name || u.email}'s Super Admin access. This can't be undone.`,
                                    confirmLabel: "Delete permanently",
                                    danger: true,
                                    action: () => {
                                      setConfirm(null);
                                      runAction(() => deleteUserAction(u.id));
                                    },
                                  })
                                }
                              >
                                <Trash2 size={13} />Delete
                              </button>
                            </div>
                          )}
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

      <AddAdminModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />
    </div>
  );
}

function AddAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <AddAdminModalForm onClose={onClose} /> : null;
}

function AddAdminModalForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const submit = () => {
    if (!name || !email) {
      addToast("Name and email required", "danger");
      return;
    }
    startTransition(async () => {
      const result = await createAdminUserAction({ fullName: name, email });
      if (!result.ok) {
        addToast(result.message, "danger");
        return;
      }
      let copied = false;
      try {
        await navigator.clipboard.writeText(result.link);
        copied = true;
      } catch {
        window.prompt("Copy this one-time sign-in link:", result.link);
      }
      addToast(
        (result.emailed ? `Invite emailed to ${result.email}` : "Email isn't set up, so nothing was sent") +
          (copied ? ". Link copied to your clipboard." : "."),
        result.emailed ? "ok" : "info",
      );
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a Super Admin"
      width={480}
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
        <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", lineHeight: 1.5 }}>
          They&apos;ll get full Super Admin access to this portal. We&apos;ll email them a one-time link to set their
          own password.
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--ml-ink-muted)", marginBottom: 4, fontWeight: 500 }}>Full name *</div>
          <input className="input input-plain" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ayesha Malik" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--ml-ink-muted)", marginBottom: 4, fontWeight: 500 }}>Email *</div>
          <input className="input input-plain" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
      </div>
    </Modal>
  );
}
