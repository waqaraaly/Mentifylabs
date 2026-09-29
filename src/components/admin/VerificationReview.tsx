"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Download, Eye, FileText, ShieldCheck, X } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { PractitionerDocument } from "@/types/document";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Modal, ConfirmDialog, type ConfirmConfig } from "./ui/Overlays";
import { Section, SummaryItem, sectionGrid } from "./ui/Detail";
import { DocumentViewer } from "./ui/DocumentViewer";
import { useToast } from "./ui/ToastProvider";
import { approveVerificationAction, rejectVerificationAction } from "@/app/admin/actions";
import { verificationDaysLeft } from "@/lib/verification";

const BACK_HREF = "/admin/verification";

export function VerificationReview({ p, documents }: { p: Practitioner; documents: PractitionerDocument[] }) {
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [viewDoc, setViewDoc] = useState<PractitionerDocument | null>(null);
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const daysLeft = verificationDaysLeft(p.dateJoined);

  const approve = () => setConfirm({
    title: "Approve verification?",
    body: `${p.fullName} will get the verified badge on their public profile.`,
    confirmLabel: "Approve",
    action: () => startTransition(async () => {
      await approveVerificationAction(p.slug);
      addToast("Verification approved", "ok");
      setConfirm(null);
      router.push(BACK_HREF);
    }),
  });

  const reject = () => startTransition(async () => {
    await rejectVerificationAction(p.slug, note);
    addToast(`Sent back to ${p.fullName} for resubmission`, "danger");
    setRejectOpen(false);
    router.push(BACK_HREF);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Link className="btn btn-ghost btn-sm" href={BACK_HREF} style={{ marginLeft: -10 }}><ArrowLeft size={14} />Verification queue</Link>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar name={p.fullName} size="lg" />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em" }}>{p.fullName}</h2>
              <Badge kind={p.verificationStatus} />
            </div>
            <div style={{ color: "var(--ml-ink-muted)", fontSize: 14, marginTop: 4 }}>{p.professionalTitle}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {documents.length > 0 && (
              <button className="btn btn-sm" onClick={() => setViewDoc(documents[0])}>
                <FileText size={13} />View documents<span className="pill tnum" style={{ marginLeft: 2 }}>{documents.length}</span>
              </button>
            )}
            <button className="btn btn-sm btn-danger" onClick={() => setRejectOpen(true)}><X size={13} />Send back</button>
            <button className="btn btn-sm btn-primary" disabled={pending} onClick={approve}><Check size={13} />Approve</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", borderTop: "1px solid var(--ml-border-soft)", background: "var(--ml-surface-2)" }}>
          <SummaryItem label="Joined" value={p.dateJoined} />
          <SummaryItem label="Submitted" value={p.verificationSubmittedAt?.slice(0, 10) ?? "—"} />
          <SummaryItem label="60-day window" value={daysLeft >= 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`} />
          <SummaryItem label="Documents" value={String(documents.length)} />
        </div>
      </div>

      {p.verificationNote && (
        <div className="card" style={{ padding: "14px 20px", background: "var(--ml-warn-bg)", borderColor: "transparent", fontSize: 13.5, color: "var(--ml-warn)" }}>
          <strong>Previous feedback sent:</strong> {p.verificationNote}
        </div>
      )}

      <div style={sectionGrid}>
        <Section icon={<FileText size={15} />} title="Submitted documents" span={2}>
          {documents.length === 0 ? (
            <div style={{ padding: "12px 0", fontSize: 13 }} className="subtle">No documents uploaded yet.</div>
          ) : documents.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--ml-border-soft)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--ml-surface-3)", display: "grid", placeItems: "center", color: "var(--ml-ink-muted)", flexShrink: 0 }}>
                <ShieldCheck size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }} className="truncate">{d.name}</div>
                <div style={{ fontSize: 12, color: "var(--ml-ink-subtle)", marginTop: 1 }}>{d.category}</div>
              </div>
              <button className="btn btn-sm" onClick={() => setViewDoc(d)}><Eye size={13} />View</button>
              {d.hasFile && (
                <a className="btn btn-sm btn-ghost" href={`/documents/${d.id}?download=1`} title={"Download " + d.name}><Download size={13} /></a>
              )}
            </div>
          ))}
        </Section>
      </div>

      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Send ${p.fullName}'s verification back`}
        width={520}
        footer={
          <>
            <button className="btn" onClick={() => setRejectOpen(false)}>Cancel</button>
            <button className="btn btn-danger" disabled={!note.trim() || pending} onClick={reject}>
              <X size={13} />Send back &amp; notify
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginBottom: 10, lineHeight: 1.5 }}>
          They&apos;ll see this feedback and can upload a new document to resubmit.
        </div>
        <div style={{ fontSize: 12, color: "var(--ml-ink-muted)", marginBottom: 6, fontWeight: 500 }}>
          Feedback <span style={{ color: "var(--ml-danger)" }}>*</span>
        </div>
        <textarea
          className="input input-plain"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Explain what's wrong — e.g. the document is blurry, expired, or doesn't match their name…"
          style={{ minHeight: 120, height: "auto", padding: "10px 12px", fontFamily: "var(--ml-font)", resize: "vertical" }}
        />
      </Modal>

      <DocumentViewer docs={documents} active={viewDoc} onSelect={setViewDoc} onClose={() => setViewDoc(null)} personName={p.fullName} />
    </div>
  );
}
