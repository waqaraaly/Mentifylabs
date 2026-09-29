"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check, X, ArrowLeft, Video, MapPin, Globe, Clock, FileText, Shield, Download, Eye,
  UserRound, Stethoscope, GraduationCap, Layers, Wallet, AlertTriangle,
} from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { PractitionerDocument } from "@/types/document";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Modal, ConfirmDialog, type ConfirmConfig } from "./ui/Overlays";
import { Section, Row, SummaryItem, dash, sectionGrid } from "./ui/Detail";
import { DocumentViewer } from "./ui/DocumentViewer";
import { useToast } from "./ui/ToastProvider";
import { approveProfileAction, rejectProfileAction } from "@/app/admin/actions";
import { computeProfileGaps } from "@/lib/admin";
import { formatFeeRange } from "@/lib/fees";

const BACK_HREF = "/admin/pending";




export function ProfileReview({
  p,
  documents,
  siteUrl,
}: {
  p: Practitioner;
  documents: PractitionerDocument[];
  siteUrl: string;
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
  const feeText = formatFeeRange(p.feeRange);

  const approve = () => setConfirm({
    title: "Approve & publish profile?",
    body: `${p.fullName}'s public profile will be visible at ${publicLink} and they can start receiving bookings.`,
    confirmLabel: "Approve & publish",
    action: () => startTransition(async () => {
      await approveProfileAction(p.slug);
      addToast("Profile approved & published", "ok");
      setConfirm(null);
      router.push(BACK_HREF);
    }),
  });

  const reject = () => startTransition(async () => {
    await rejectProfileAction(p.slug, note);
    addToast(`${p.fullName}'s profile sent back for edits`, "danger");
    setRejectOpen(false);
    router.push(BACK_HREF);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Link className="btn btn-ghost btn-sm" href={BACK_HREF} style={{ marginLeft: -10 }}><ArrowLeft size={14} />Review queue</Link>
      </div>

      {/* Identity + decision actions */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar name={p.fullName} size="lg" />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em" }}>{p.fullName}</h2>
              <Badge kind={p.status} />
              <Badge kind={p.profileStatus} />
            </div>
            <div style={{ color: "var(--zf-ink-muted)", fontSize: 14, marginTop: 4 }}>{p.professionalTitle}</div>
            <div className="mono" style={{ color: "var(--zf-ink-subtle)", fontSize: 12, marginTop: 6 }}>{publicLink}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {documents.length > 0 && (
              <button className="btn btn-sm" onClick={() => setViewDoc(documents[0])}>
                <FileText size={13} />View documents<span className="pill tnum" style={{ marginLeft: 2 }}>{documents.length}</span>
              </button>
            )}
            <button className="btn btn-sm btn-danger" onClick={() => setRejectOpen(true)}><X size={13} />Reject</button>
            <button className="btn btn-sm btn-primary" disabled={pending} onClick={approve}><Check size={13} />Approve</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", borderTop: "1px solid var(--zf-border-soft)", background: "var(--zf-surface-2)" }}>
          <SummaryItem label="Submitted" value={p.dateJoined} />
          <SummaryItem label="Experience" value={`${p.experienceYears} ${p.experienceYears === 1 ? "year" : "years"}`} />
          <SummaryItem label="Location" value={p.location ?? "Not set"} />
          <SummaryItem label="Documents" value={String(documents.length)} />
        </div>
      </div>

      {(gaps.length > 0 || p.rejectionNote) && (
        <div className="card" style={{ padding: "14px 20px", display: "flex", gap: 12, alignItems: "flex-start", background: "var(--zf-warn-bg)", borderColor: "transparent" }}>
          <AlertTriangle size={17} style={{ color: "var(--zf-warn)", marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 13.5, color: "var(--zf-warn)" }}>
            {gaps.length > 0 && <div><strong>Missing before approval:</strong> {gaps.join(", ")}</div>}
            {p.rejectionNote && <div style={{ marginTop: gaps.length > 0 ? 4 : 0 }}><strong>Previous feedback:</strong> {p.rejectionNote}</div>}
          </div>
        </div>
      )}

      <div style={sectionGrid}>
        <Section icon={<UserRound size={15} />} title="About" span={2}>
          <div style={{ padding: "12px 0 6px", fontSize: 13.5, color: "var(--zf-ink-2)", lineHeight: 1.65 }}>
            {p.bio || <span className="subtle">No bio provided.</span>}
          </div>
        </Section>

        <Section icon={<Stethoscope size={15} />} title="Specializations">
          {p.specializations.length === 0 ? <div style={{ padding: "12px 0" }}>{dash}</div> : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "12px 0 6px" }}>
              {p.specializations.map((sp) => (
                <span key={sp} style={{ padding: "3px 10px", background: "var(--zf-accent-tint)", color: "var(--zf-accent-2)", borderRadius: 999, fontSize: 12, fontWeight: 500 }}>{sp}</span>
              ))}
            </div>
          )}
          <Row label="Languages">{p.languages.length ? (
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Globe size={13} style={{ color: "var(--zf-ink-subtle)" }} />{p.languages.join(" · ")}</span>
          ) : dash}</Row>
        </Section>

        <Section icon={<Layers size={15} />} title="Sessions & fees">
          <Row label="Online">
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center", opacity: p.sessionType === "offline" ? 0.5 : 1 }}>
              <Video size={13} />{p.sessionType !== "offline" ? "Available" : "Not offered"}
            </span>
          </Row>
          <Row label="Onsite">
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center", opacity: p.sessionType === "online" ? 0.5 : 1 }}>
              <MapPin size={13} />{p.sessionType !== "online" ? (p.location ?? "Available") : "Not offered"}
            </span>
          </Row>
          <Row label="Fee range">
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }} className="tnum">
              <Wallet size={13} style={{ color: "var(--zf-ink-subtle)" }} />{feeText ?? <span className="subtle">Not set</span>}
            </span>
          </Row>
          <Row label="Experience">
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Clock size={13} style={{ color: "var(--zf-ink-subtle)" }} />{p.experienceYears} {p.experienceYears === 1 ? "year" : "years"}
            </span>
          </Row>
        </Section>

        <Section icon={<GraduationCap size={15} />} title="Education">
          {p.education.length === 0 ? <div style={{ padding: "12px 0" }}>{dash}</div> : p.education.map((e, i) => (
            <Row key={i} label={`#${i + 1}`}>{e}</Row>
          ))}
        </Section>

        <Section icon={<Shield size={15} />} title="Certifications & licenses">
          {p.certifications.length === 0 ? (
            <div style={{ padding: "12px 0", fontSize: 13 }} className="subtle">No certifications uploaded.</div>
          ) : p.certifications.map((c, i) => (
            <Row key={i} label={`#${i + 1}`}>{c}</Row>
          ))}
        </Section>

        <Section icon={<FileText size={15} />} title="Uploaded documents" span={2}>
          {documents.length === 0 ? <div style={{ padding: "12px 0", fontSize: 13 }} className="subtle">No documents uploaded.</div> : documents.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--zf-border-soft)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--zf-surface-3)", display: "grid", placeItems: "center", color: "var(--zf-ink-muted)", flexShrink: 0 }}>
                <FileText size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }} className="truncate">{d.name}</div>
                <div style={{ fontSize: 12, color: "var(--zf-ink-subtle)", marginTop: 1 }}>{d.category}</div>
              </div>
              <button className="btn btn-sm" onClick={() => setViewDoc(d)}><Eye size={13} />View</button>
              <button className="btn btn-sm btn-ghost" onClick={() => addToast("Downloading " + d.name, "info")}><Download size={13} /></button>
            </div>
          ))}
        </Section>
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
          style={{ minHeight: 120, height: "auto", padding: "10px 12px", fontFamily: "var(--zf-font)", resize: "vertical" }}
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
    </div>
  );
}

