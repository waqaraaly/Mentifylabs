"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw, ShieldCheck, Trash2, User, UserPlus } from "lucide-react";
import type { AdminUser } from "@/data/users";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { SearchInput, FilterSelect } from "./ui/Inputs";
import { EmptyState, Modal, ConfirmDialog, type ConfirmConfig } from "./ui/Overlays";
import { useToast } from "./ui/ToastProvider";
import { TopBar } from "./TopBar";
import { createAdminUserAction, deleteUserAction, disableUserAction, enableUserAction } from "@/app/admin/users/actions";

export function ManageUsersView({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      practitioner: users.filter((u) => u.role === "practitioner").length,
    }),
    [users],
  );

  const filtered = users
    .filter((u) => (roleFilter === "all" ? true : u.role === roleFilter))
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
        title="Manage Users"
        subtitle="Every sign-in account on the platform — Super Admins and practitioners."
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setAddOpen(true)}>
            <UserPlus size={13} />Add Super Admin
          </button>
        }
      />

      <div style={{ padding: "0 32px 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--ml-border)", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="h2" style={{ fontSize: 15 }}>All accounts</div>
              <div style={{ fontSize: 12, color: "var(--ml-ink-subtle)", marginTop: 1 }}>
                <span className="tnum">{filtered.length}</span> of <span className="tnum">{counts.all}</span> shown
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <SearchInput value={q} onChange={setQ} placeholder="Search by name or email…" width={260} />
              <FilterSelect
                value={roleFilter}
                onChange={setRoleFilter}
                width={190}
                options={[
                  { value: "all", label: `All roles (${counts.all})` },
                  { value: "admin", label: `Super Admin (${counts.admin})` },
                  { value: "practitioner", label: `Practitioner (${counts.practitioner})` },
                ]}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No accounts match" body="Try a different role or search term." />
          ) : (
            <div className="table-scroll scroll-y">
              <table className="table" style={{ border: "none" }}>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th className="hide-sm">Email</th>
                    <th>Role</th>
                    <th className="hide-md">Linked profile</th>
                    <th>Status</th>
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
                            <Avatar name={u.name || u.email} size="md" />
                            <span style={{ fontWeight: 500, color: "var(--ml-ink)" }}>{u.name || "—"}</span>
                            {isSelf && <span className="badge" style={{ color: "var(--ml-info)", background: "var(--ml-info-bg)" }}>You</span>}
                          </div>
                        </td>
                        <td className="hide-sm mono" style={{ fontSize: 12.5, color: "var(--ml-ink-muted)" }}>{u.email}</td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                            {u.role === "admin" ? <ShieldCheck size={14} style={{ color: "var(--ml-accent)" }} /> : <User size={14} style={{ color: "var(--ml-ink-subtle)" }} />}
                            {u.role === "admin" ? "Super Admin" : "Practitioner"}
                          </span>
                        </td>
                        <td className="hide-md">
                          {u.practitionerSlug ? (
                            <Link href={`/admin/practitioners/${u.practitionerSlug}`} className="mono" style={{ fontSize: 12.5 }} onClick={(e) => e.stopPropagation()}>
                              {u.practitionerFullName}
                            </Link>
                          ) : (
                            <span className="subtle">—</span>
                          )}
                        </td>
                        <td>{u.disabledAt ? <Badge kind="disabled" /> : <Badge kind="active" />}</td>
                        <td className="hide-md mono tnum" style={{ fontSize: 12.5, color: "var(--ml-ink-subtle)" }}>
                          {u.createdAt.slice(0, 10)}
                        </td>
                        <td style={{ textAlign: "right", paddingRight: 18 }}>
                          {isSelf ? (
                            <span className="subtle" style={{ fontSize: 12.5 }}>—</span>
                          ) : (
                            <div style={{ display: "inline-flex", gap: 6 }}>
                              {u.disabledAt ? (
                                <button
                                  className="btn btn-sm"
                                  disabled={pending}
                                  onClick={() => runAction(() => enableUserAction(u.id))}
                                >
                                  <RotateCcw size={13} />Enable
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm"
                                  disabled={pending}
                                  onClick={() =>
                                    setConfirm({
                                      title: "Disable this account?",
                                      body: `${u.name || u.email} won't be able to sign in until you re-enable it. This doesn't delete anything.`,
                                      confirmLabel: "Disable",
                                      danger: true,
                                      action: () => {
                                        setConfirm(null);
                                        runAction(() => disableUserAction(u.id));
                                      },
                                    })
                                  }
                                >
                                  <Ban size={13} />Disable
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-danger"
                                disabled={pending}
                                onClick={() =>
                                  setConfirm({
                                    title: "Delete this account permanently?",
                                    body:
                                      u.role === "practitioner"
                                        ? `This removes ${u.name || u.email}'s sign-in access for good. Their public profile and data stay intact — manage that from Practitioners. This can't be undone.`
                                        : `This permanently removes ${u.name || u.email}'s Super Admin access. This can't be undone.`,
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
