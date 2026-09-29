"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Video, MapPin, Globe, Clock, FileText, Shield, Download, Eye } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { PractitionerDocument } from "@/types/document";
import { Avatar } from "./ui/Avatar";
import { Drawer, Modal, ConfirmDialog, type ConfirmConfig } from "./ui/Overlays";
import { DocumentViewer } from "./ui/DocumentViewer";
import { useToast } from "./ui/ToastProvider";
import { approveProfileAction, rejectProfileAction } from "@/app/admin/actions";
import { computeProfileGaps } from "@/lib/admin";

export function ProfileReviewDrawer({
  practitioner,
  documents,
  siteUrl,
  onClose,
}: {
  practitioner: Practitioner | null;
  documents: PractitionerDocument[];
  siteUrl: string;
  onClose: () => void;
}) {
  return (
    <Drawer open={!!practitioner} onClose={onClose} width={820}>
      {practitioner && (
        <ProfilePreview
          key={practitioner.slug}
          p={practitioner}
          documents={documents}
          siteUrl={siteUrl}
          onClose={onClose}
        />
      )}
    </Drawer>
  );
}

function ProfilePreview({
  p,
  documents,
  siteUrl,
  onClose,
}: {
  p: Practitioner;
  documents: PractitionerDocument[];
  siteUrl: string;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [viewDoc, setViewDoc] = useState<PractitionerDocument | null>(null);
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const gaps = computeProfileGaps(p);
  const publicLink = `${siteUrl.replace(/^https?:\/\//, "")}/${p.slug}`;

  const approve = () => setConfirm({
    title: "Approve & publish profile?",
    body: `${p.fullName}'s public profile will be visible at ${publicLink} and they can start receiving bookings.`,
    confirmLabel: "Approve & publish",
    action: () => startTransition(async () => {
      await approveProfileAction(p.slug);
      addToast("Profile approved & published", "ok");
      setConfirm(null);
      router.refresh();
      onClose();
    }),
  });

  const reject = () => startTransition(async () => {
    await rejectProfileAction(p.slug, note);
    addToast(`${p.fullName}'s profile sent back for edits`, "danger");
    setRejectOpen(false);
    router.refresh();
    onClose();
  });

  return (
    <>
      <div style={{
        padding: "12px 20px", borderBottom: "1px solid var(--zf-border)", background: "var(--zf-surface-2)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        position: "sticky", top: 0, zIndex: 5,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} />Close</button>
          <span style={{ fontSize: 12.5, color: "var(--zf-ink-muted)" }} className="mono">{publicLink}</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {documents.length > 0 && (
            <button className="btn btn-sm" onClick={() => setViewDoc(documents[0])}>
              <FileText size={13} />View documents<span className="pill tnum" style={{ marginLeft: 2 }}>{documents.length}</span>
            </button>
          )}
          <button className="btn btn-sm btn-danger" onClick={() => setRejectOpen(true)}><X size={13} />Reject</button>
          <button className="btn btn-sm btn-primary" disabled={pending} onClick={approve}><Check size={13} />Approve</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <div style={{ padding: "32px 40px 48px", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>
            <Avatar name={p.fullName} size="lg" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em" }}>{p.fullName}</div>
              <div style={{ fontSize: 15, color: "var(--zf-ink-muted)", marginTop: 2 }}>{p.professionalTitle}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10, fontSize: 12.5, color: "var(--zf-ink-muted)" }}>
                {p.location && <span style={{ display: "flex", gap: 4, alignItems: "center" }}><MapPin size={12} />{p.location}</span>}
                <span style={{ display: "flex", gap: 4, alignItems: "center" }}><Clock size={12} />{p.experienceYears} years</span>
                {p.languages.length > 0 && <span style={{ display: "flex", gap: 4, alignItems: "center" }}><Globe size={12} />{p.languages.join(", ")}</span>}
              </div>
            </div>
          </div>

          <Section title="About">
            <div style={{ fontSize: 14, color: "var(--zf-ink-2)", lineHeight: 1.65 }}>
              {p.bio || <span className="subtle">No bio provided.</span>}
            </div>
          </Section>

          <Section title="Specializations">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {p.specializations.length === 0 && <span className="subtle">—</span>}
              {p.specializations.map((s) => (
                <span key={s} style={{ padding: "5px 11px", background: "var(--zf-accent-tint)", color: "var(--zf-accent-2)", borderRadius: 999, fontSize: 12.5 }}>{s}</span>
              ))}
            </div>
          </Section>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 28 }}>
            <Section title="Education" inline>
              {p.education.length === 0 && <span className="subtle">—</span>}
              {p.education.map((e, i) => (
                <div key={i} style={{ fontSize: 13.5, color: "var(--zf-ink-2)", marginTop: 4, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <FileText size={13} style={{ color: "var(--zf-ink-subtle)", marginTop: 3 }} />{e}
                </div>
              ))}
            </Section>
            <Section title="Certifications" inline>
              {p.certifications.length === 0 ? <span className="subtle">—</span> : p.certifications.map((c, i) => (
                <div key={i} style={{ fontSize: 13.5, color: "var(--zf-ink-2)", marginTop: 4, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Shield size={13} style={{ color: "var(--zf-accent)", marginTop: 3 }} />{c}
                </div>
              ))}
            </Section>
          </div>

          <Section title="Uploaded documents">
            {documents.length === 0 ? <span className="subtle">No documents uploaded.</span> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {documents.map((d) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "1px solid var(--zf-border)", borderRadius: 8, background: "var(--zf-surface)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 7, background: "var(--zf-surface-3)", display: "grid", placeItems: "center", color: "var(--zf-ink-muted)", flexShrink: 0 }}>
                      <FileText size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }} className="truncate">{d.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--zf-ink-subtle)", display: "flex", gap: 8, marginTop: 1 }}>
                        <span>{d.category}</span>
                      </div>
                    </div>
                    <button className="btn btn-sm" onClick={() => setViewDoc(d)}><Eye size={13} />View</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => addToast("Downloading " + d.name, "info")}><Download size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Sessions">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <PreviewBox icon={<Video size={13} />} label="Online" value={p.sessionType !== "offline" ? "Available" : "Not offered"} muted={p.sessionType === "offline"} />
              <PreviewBox icon={<MapPin size={13} />} label="Onsite" value={p.sessionType !== "online" ? (p.location ?? "Available") : "Not offered"} muted={p.sessionType === "online"} />
            </div>
            <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--zf-ink-2)" }}>
              <strong>Fee:</strong>{" "}
              <span className="tnum">
                {p.feeRange.min || p.feeRange.max
                  ? `${p.feeRange.currency} ${p.feeRange.min}–${p.feeRange.max}`
                  : <span className="subtle">Not set</span>}
              </span>
            </div>
          </Section>
        </div>
      </div>

      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Reject ${p.fullName}'s profile`}
        width={520}
        footer={
          <>
            <button className="btn" onClick={() => setRejectOpen(false)}>Cancel</button>
            <button className="btn btn-danger" disabled={!note.trim() || pending} onClick={reject}>
              <X size={13} />Reject &amp; send feedback
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--zf-ink-muted)", marginBottom: 10, lineHeight: 1.5 }}>
          The profile won&apos;t be published. {p.fullName} will receive your feedback and can resubmit after making changes.
        </div>
        <div style={{ fontSize: 12, color: "var(--zf-ink-muted)", marginBottom: 6, fontWeight: 500 }}>
          Feedback for the practitioner <span style={{ color: "var(--zf-danger)" }}>*</span>
        </div>
        <textarea
          className="input input-plain"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Explain why the profile can't be approved yet — e.g. add a profile photo, expand the bio, upload a license…"
          style={{ minHeight: 120, fontFamily: "var(--zf-font)", resize: "vertical" }}
        />
        {gaps.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="label">Auto-detected gaps — tap to add</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {gaps.map((m) => (
                <span
                  key={m}
                  onClick={() => setNote((n) => (n ? n + "\n• " + m : "• " + m))}
                  style={{ padding: "3px 9px", background: "var(--zf-warn-bg)", color: "var(--zf-warn)", borderRadius: 999, fontSize: 11.5, cursor: "pointer" }}
                >
                  + {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <DocumentViewer docs={documents} active={viewDoc} onSelect={setViewDoc} onClose={() => setViewDoc(null)} personName={p.fullName} />
    </>
  );
}

function Section({ title, children, inline }: { title: string; children: React.ReactNode; inline?: boolean }) {
  return (
    <div style={{ marginTop: inline ? 0 : 28 }}>
      <div style={{ fontSize: 11, color: "var(--zf-ink-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function PreviewBox({ icon, label, value, muted }: { icon: React.ReactNode; label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ padding: 12, border: "1px solid var(--zf-border)", borderRadius: 8, background: "var(--zf-surface-2)", opacity: muted ? 0.55 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--zf-ink-muted)", fontSize: 12 }}>{icon}{label}</div>
      <div style={{ marginTop: 4, fontSize: 13.5, fontWeight: 500 }}>{value}</div>
    </div>
  );
}
