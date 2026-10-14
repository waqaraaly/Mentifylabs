"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, FileText, RotateCcw, ShieldCheck, User } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { PractitionerDocument } from "@/types/document";
import { Modal, ConfirmDialog, type ConfirmConfig } from "./ui/Overlays";
import { DocumentList } from "./ui/DocumentList";
import { SheetGroup, Field, ActionRow } from "./ui/Sheet";
import { useToast } from "./ui/ToastProvider";
import { approveSubmissionAction, rejectSubmissionAction } from "@/app/admin/actions";
import { daysSinceSubmitted, isAwaitingApproval } from "@/lib/verification";
import { isSentBack } from "@/lib/reviewQueue";
import { documentsFingerprint } from "@/lib/documentRules";
import { reportDecision } from "@/lib/decisionResult";

const BACK_HREF = "/admin/pending";

// Dates are shown in UTC so the server and the browser always agree.
const day = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

function waited(days: number | null) {
  if (days === null) return "";
  if (days <= 0) return " (today)";
  return days === 1 ? " (1 day ago)" : ` (${days} days ago)`;
}

/**
 * The credential review: who they are, what they submitted, and the decision. Nothing else. Approving verifies their
 * credentials; the practitioner then publishes their own profile.
 */
export interface SendBack {
  id: string;
  at: string;
  reason: string;
  by: string;
}

export function CredentialReview({
  p,
  documents,
  sentBack,
  sendBacks,
}: {
  p: Practitioner;
  documents: PractitionerDocument[];
  sentBack?: { at: string; rounds: number; waitingDays: number };
  sendBacks: SendBack[];
}) {
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const awaiting = isAwaitingApproval(p);
  // Nothing to approve on: the server refuses too, this just says why before the click.
  const noFile = !documents.some((d) => d.hasFile);
  const recorded = sendBacks.map((r, i) => ({ ...r, round: i + 1 }));
  // Older accounts may have no recorded history; the current reason is still shown.
  const history = (recorded.length === 0 && isSentBack(p)
    ? [{ id: "current", at: sentBack?.at ?? "", reason: p.verificationNote ?? "", by: "", round: 1 }]
    : recorded
  ).slice().reverse();

  const approve = () => setConfirm({
    title: "Approve credentials?",
    body: `${p.fullName}'s credentials will be marked verified. They'll be emailed, and can then publish their own profile.`,
    confirmLabel: "Approve",
    action: () => startTransition(async () => {
      const result = await approveSubmissionAction(p.slug, documentsFingerprint(documents));
      setConfirm(null);
      // If it didn't go through, stay here on a refreshed page so the admin sees what is current.
      if (reportDecision(result, addToast, { message: `${p.fullName} approved` })) router.push(BACK_HREF);
      else router.refresh();
    }),
  });

  const sendBack = () => startTransition(async () => {
    const result = await rejectSubmissionAction(p.slug, note, documentsFingerprint(documents));
    setSendBackOpen(false);
    if (reportDecision(result, addToast, { message: `Sent back to ${p.fullName}`, kind: "danger" })) router.push(BACK_HREF);
    else router.refresh();
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Link className="btn btn-ghost btn-sm" href={BACK_HREF} style={{ marginLeft: -10 }}><ArrowLeft size={14} />Credential review</Link>
      </div>

      <div className="card sheet">
        <SheetGroup icon={<User size={14} />} title="Practitioner" />
        <Field label="Full name">{p.fullName}</Field>
        <Field label="Professional title">{p.professionalTitle}</Field>
        <Field label="Email">{p.email}</Field>
        <Field label="Date joined"><span className="tnum">{day(p.dateJoined)}</span></Field>
        <Field label="Submitted"><span className="tnum">{day(p.verificationSubmittedAt)}{waited(daysSinceSubmitted(p.verificationSubmittedAt))}</span></Field>
        {isSentBack(p) && sentBack && (
          <Field label="Waiting for them"><span className="tnum">{sentBack.waitingDays <= 0 ? "Since today" : sentBack.waitingDays === 1 ? "1 day" : `${sentBack.waitingDays} days`}</span></Field>
        )}
        <Field label="Full profile"><Link className="btn btn-sm" href={`/admin/practitioners/${p.slug}`}>Open profile<ArrowUpRight size={12} /></Link></Field>

        {history.length > 0 && (
          <>
            <SheetGroup icon={<RotateCcw size={14} />} title={`Sent back ${history.length === 1 ? "once" : `${history.length} times`}`} />
            {history.map((r) => (
              <div key={r.id} className="sheet-row">
                <div className="sheet-label">
                  Round {r.round}
                  {r.round === history.length && history.length > 1 && <span className="subtle" style={{ display: "block", fontWeight: 400, marginTop: 2 }}>Latest</span>}
                </div>
                <div className="sheet-body">
                  <div className="tnum" style={{ fontWeight: 600, color: "var(--ml-ink)" }}>{day(r.at)}{r.by ? <span style={{ fontWeight: 400, color: "var(--ml-ink-muted)" }}> · by {r.by}</span> : null}</div>
                  <div style={{ marginTop: 6, color: r.reason ? "var(--ml-ink-2)" : "var(--ml-ink-subtle)", lineHeight: 1.6, whiteSpace: "pre-line" }}>{r.reason || "No reason was recorded."}</div>
                </div>
              </div>
            ))}
          </>
        )}

        <SheetGroup icon={<FileText size={14} />} title={isSentBack(p) ? "Documents they last submitted" : "Documents submitted"} />
        <div style={{ padding: "22px 36px" }}>
          <DocumentList documents={documents} personName={p.fullName} />
        </div>

        <SheetGroup icon={<ShieldCheck size={14} />} title="Decision" />
        {awaiting ? (
          <ActionRow title="Review credentials" text={noFile ? "There is no document file to review, so you can't approve. Send it back and ask them to upload one." : "Approving verifies them and lets them publish their profile. Sending back lets them fix the problem and submit again, with your reason if you give one."}>
            <button className="btn btn-primary" disabled={pending || noFile} title={noFile ? "No document file to review" : undefined} onClick={approve}><Check size={14} />Approve</button>
            <button className="btn btn-danger" disabled={pending} onClick={() => { setNote(""); setSendBackOpen(true); }}>Send back</button>
          </ActionRow>
        ) : isSentBack(p) ? (
          <ActionRow title="Waiting for the practitioner" text="You sent these credentials back. When they submit again they return to the Awaiting review list, and you can decide then.">
            <Link className="btn" href={BACK_HREF}>Back to the queue</Link>
          </ActionRow>
        ) : (
          <ActionRow title="Nothing to decide" text="This submission isn't waiting for review. It may already have been decided, or the account may be suspended.">
            <Link className="btn" href={BACK_HREF}>Back to the queue</Link>
          </ActionRow>
        )}
      </div>

      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />

      <Modal
        open={sendBackOpen}
        onClose={() => setSendBackOpen(false)}
        title={`Send ${p.fullName}'s credentials back`}
        width={520}
        footer={
          <>
            <button className="btn" onClick={() => setSendBackOpen(false)}>Cancel</button>
            <button className="btn btn-danger" disabled={pending} onClick={sendBack}>Send back</button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginBottom: 12, lineHeight: 1.5 }}>
          They can upload new documents and submit again. They&apos;ll see your reason.
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginBottom: 6, fontWeight: 500 }}>
          Reason <span style={{ fontWeight: 400, color: "var(--ml-ink-subtle)" }}>(optional)</span>
        </div>
        <textarea
          className="input input-plain"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What do they need to fix or provide?"
          style={{ minHeight: 110, height: "auto", padding: "10px 12px", fontFamily: "var(--ml-font)", resize: "vertical" }}
        />
      </Modal>
    </div>
  );
}
