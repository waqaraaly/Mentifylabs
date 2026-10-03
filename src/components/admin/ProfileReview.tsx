"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check, X, ArrowLeft, FileText, Download, Eye, Mail, Phone, Link2, Info, CircleCheck, CircleAlert,
} from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { PractitionerDocument } from "@/types/document";
import type { ReviewEvent } from "@/types/reviewEvent";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Modal, ConfirmDialog, type ConfirmConfig } from "./ui/Overlays";
import { Row, dash } from "./ui/Detail";
import { DocumentViewer } from "./ui/DocumentViewer";
import { ReviewHistory } from "./ReviewHistory";
import { useToast } from "./ui/ToastProvider";
import { approveSubmissionAction, rejectSubmissionAction } from "@/app/admin/actions";
import { computeProfileGaps } from "@/lib/admin";
import { formatFeeRange } from "@/lib/fees";
import { formatFileSize } from "@/lib/format";
import { daysSinceSubmitted, isAwaitingApproval } from "@/lib/verification";

const BACK_HREF = "/admin/pending";

/** Everything checked before approval, in the order shown. The first is the credentials; the rest is the profile. */
const DOCUMENTS_CHECK = "Credential documents";
const CHECKS = [DOCUMENTS_CHECK, "Profile photo", "Bio (120+ characters)", "Fee range", "Certifications", "Specializations"];

const SESSION_MODE = { online: "Online only", offline: "On-site only", both: "Online and on-site" } as const;

type TabId = "documents" | "profile" | "details" | "history";

// Dates are shown in UTC so the server and the browser always agree.
const formatDay = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

/** One labelled block of the profile, separated from the one above by a rule. */
function Block({ label, children, first = false }: { label: string; children: ReactNode; first?: boolean }) {
  return (
    <div style={{ padding: "18px 0", borderTop: first ? "none" : "1px solid var(--ml-border-soft)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ml-ink-subtle)", marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}

const muted = (text: string) => <span className="subtle" style={{ fontSize: 13 }}>{text}</span>;

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return muted(empty);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((sp) => (
        <span key={sp} style={{ padding: "3px 10px", background: "var(--ml-accent-tint)", color: "var(--ml-accent-2)", borderRadius: 999, fontSize: 12.5, fontWeight: 500 }}>{sp}</span>
      ))}
    </div>
  );
}

function Lines({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return muted(empty);
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.5 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ml-accent)", marginTop: 7, flexShrink: 0 }} />
          <span style={{ minWidth: 0, wordBreak: "break-word" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The single review page: a compact header saying who this is, one tabbed surface for the evidence
 * (documents, profile, details, history), and a sticky panel with the checklist and the one decision.
 * Approving verifies their credentials and activates the account; the practitioner publishes their own profile.
 */
export function ProfileReview({
  p,
  documents,
  history,
  siteUrl,
}: {
  p: Practitioner;
  documents: PractitionerDocument[];
  history: ReviewEvent[];
  siteUrl: string;
}) {
  const [tab, setTab] = useState<TabId>("documents");
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [viewDoc, setViewDoc] = useState<PractitionerDocument | null>(null);
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const awaiting = isAwaitingApproval(p);
  const waitingDays = daysSinceSubmitted(p.verificationSubmittedAt);
  const gaps = [...(documents.length === 0 ? [DOCUMENTS_CHECK] : []), ...computeProfileGaps(p)];
  const publicLink = `${siteUrl.replace(/^https?:\/\//, "")}/${p.slug}`;
  const feeText = formatFeeRange(p.feeRange);
  const publicContacts = p.contactMethods.filter((c) => c.value.trim());
  const doneCount = CHECKS.filter((c) => !gaps.includes(c)).length;
  const waitText = waitingDays === null ? "" : waitingDays <= 0 ? "today" : waitingDays === 1 ? "1 day ago" : `${waitingDays} days ago`;

  const approve = () => setConfirm({
    title: "Approve credentials?",
    body: `${p.fullName}'s credentials will be marked verified and their account made active. They'll be emailed, and can then publish their own profile.`,
    confirmLabel: "Approve",
    action: () => startTransition(async () => {
      await approveSubmissionAction(p.slug);
      addToast(`${p.fullName} approved`, "ok");
      setConfirm(null);
      router.push(BACK_HREF);
    }),
  });

  const reject = () => startTransition(async () => {
    await rejectSubmissionAction(p.slug, note);
    addToast(`Sent back to ${p.fullName} for resubmission`, "danger");
    setRejectOpen(false);
    router.push(BACK_HREF);
  });

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "documents", label: "Documents", count: documents.length },
    { id: "profile", label: "Profile" },
    { id: "details", label: "Details" },
    { id: "history", label: "History", count: history.length || undefined },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <Link className="btn btn-ghost btn-sm" href={BACK_HREF} style={{ marginLeft: -10 }}><ArrowLeft size={14} />Pending approval</Link>
      </div>

      {/* Who this is: one compact row, no card */}
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        {p.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a user-uploaded photo served from /media
          <img src={p.photoUrl} alt={p.fullName} style={{ width: 64, height: 64, borderRadius: 999, objectFit: "cover", flexShrink: 0, border: "1px solid var(--ml-border)" }} />
        ) : (
          <Avatar name={p.fullName} size="lg" />
        )}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em" }}>{p.fullName}</h2>
            <Badge kind={p.verificationStatus} />
          </div>
          <div style={{ color: "var(--ml-ink-muted)", fontSize: 14, marginTop: 3 }}>{p.professionalTitle}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 6, fontSize: 13 }}>
            <a href={`mailto:${p.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ml-ink-2)", textDecoration: "none", wordBreak: "break-all" }}>
              <Mail size={13} style={{ flexShrink: 0, color: "var(--ml-ink-subtle)" }} />{p.email}
            </a>
            {p.phone && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ml-ink-2)" }}>
                <Phone size={13} style={{ flexShrink: 0, color: "var(--ml-ink-subtle)" }} />{p.phone}
              </span>
            )}
            <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ml-ink-subtle)", fontSize: 12 }}>
              <Link2 size={13} style={{ flexShrink: 0 }} />{publicLink}
            </span>
          </div>
        </div>
      </div>

      <div className="review-layout">
        {/* The evidence, in one tabbed surface */}
        <div className="card" style={{ minWidth: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ml-border-soft)", overflowX: "auto" }}>
            <div className="tabs review-tabs" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={"tab" + (tab === t.id ? " active" : "")}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.count !== undefined && <span className="pill tnum">{t.count}</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "4px 24px 8px" }}>
            {tab === "documents" && (
              documents.length === 0 ? (
                <div style={{ padding: "36px 0", textAlign: "center" }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>No documents uploaded</div>
                  <div style={{ marginTop: 4, fontSize: 13 }} className="subtle">Credential documents will appear here once they are submitted.</div>
                </div>
              ) : documents.map((d, i) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: i === documents.length - 1 ? "none" : "1px solid var(--ml-border-soft)", flexWrap: "wrap" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--ml-surface-3)", display: "grid", placeItems: "center", color: "var(--ml-ink-muted)", flexShrink: 0 }}>
                    <FileText size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }} className="truncate">{d.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ml-ink-subtle)", marginTop: 3 }}>
                      {[d.category, formatFileSize(d.sizeBytes), `Uploaded ${formatDay(d.uploadedAt)}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => setViewDoc(d)}><Eye size={13} />View</button>
                    {d.hasFile ? (
                      <a className="btn btn-sm btn-ghost" href={`/documents/${d.id}?download=1`} title={"Download " + d.name}><Download size={13} /></a>
                    ) : (
                      <button className="btn btn-sm btn-ghost" onClick={() => addToast("This demo record has no file attached", "info")}><Download size={13} /></button>
                    )}
                  </div>
                </div>
              ))
            )}

            {tab === "profile" && (
              <>
                <Block label="Short bio" first>
                  {p.shortBio ? <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{p.shortBio}</div> : muted("No short bio.")}
                </Block>
                <Block label="Full bio">
                  {p.bio ? <div style={{ fontSize: 13.5, color: "var(--ml-ink-2)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{p.bio}</div> : muted("No bio provided.")}
                </Block>
                {p.noteForClients && (
                  <Block label="Note for future clients">
                    <div style={{ fontSize: 13.5, color: "var(--ml-ink-2)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{p.noteForClients}</div>
                  </Block>
                )}
                <Block label="Specializations"><Chips items={p.specializations} empty="None added." /></Block>
                <Block label="Services offered"><Chips items={p.services} empty="None added." /></Block>
                <Block label="Education"><Lines items={p.education} empty="No education listed." /></Block>
                <Block label="Work experience"><Lines items={p.workExperience ?? []} empty="No work experience listed." /></Block>
                <Block label="Certifications & licenses"><Lines items={p.certifications} empty="No certifications listed." /></Block>
              </>
            )}

            {tab === "details" && (
              <div className="review-dl" style={{ paddingTop: 14, paddingBottom: 10 }}>
                <div>
                  <Block label="Practice" first>
                    <Row label="Sessions">{SESSION_MODE[p.sessionType]}</Row>
                    <Row label="Location">{p.location ?? dash}</Row>
                    <Row label="Fee range"><span className="tnum">{feeText ?? <span className="subtle">Not set</span>}</span></Row>
                    <Row label="Experience">{p.experienceYears} {p.experienceYears === 1 ? "year" : "years"}</Row>
                    <Row label="Languages">{p.languages.length ? p.languages.join(" · ") : dash}</Row>
                  </Block>
                </div>
                <div>
                  <Block label="Contact & links" first>
                    {publicContacts.map((c) => (
                      <Row key={c.label} label={c.label}>
                        <span>{c.value}</span>
                        {!c.isPublic && <span className="subtle" style={{ marginLeft: 8, fontSize: 12 }}>(private)</span>}
                      </Row>
                    ))}
                    <Row label="Website">
                      {p.websiteUrl ? <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ml-accent-2)" }}>{p.websiteUrl}</a> : dash}
                    </Row>
                    {p.socialLinks.map((s) => (
                      <Row key={s.platform} label={s.platform.charAt(0).toUpperCase() + s.platform.slice(1)}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ml-accent-2)" }}>{s.url}</a>
                      </Row>
                    ))}
                  </Block>
                </div>
              </div>
            )}

            {tab === "history" && (
              <div style={{ padding: "18px 0 10px" }}>
                <ReviewHistory events={history} empty="No earlier submissions or decisions." />
              </div>
            )}
          </div>
        </div>

        {/* The decision: what is ready, what is missing, and the two actions */}
        <aside className="review-aside">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div className="h2" style={{ fontSize: 15 }}>Review</div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: gaps.length ? "var(--ml-warn)" : "var(--ml-ok)" }}>
                {doneCount} of {CHECKS.length} ready
              </div>
            </div>
            {awaiting && p.verificationSubmittedAt && (
              <div style={{ fontSize: 12.5, marginTop: 4 }} className="subtle">
                Submitted {formatDay(p.verificationSubmittedAt)}{waitText ? ` · ${waitText}` : ""}
              </div>
            )}

            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "grid", gap: 9 }}>
              {CHECKS.map((label) => {
                const ok = !gaps.includes(label);
                return (
                  <li key={label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: ok ? "var(--ml-ink)" : "var(--ml-warn)" }}>
                    {ok
                      ? <CircleCheck size={16} style={{ color: "var(--ml-ok)", flexShrink: 0 }} />
                      : <CircleAlert size={16} style={{ flexShrink: 0 }} />}
                    <span>{label}</span>
                    {!ok && <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600 }}>Missing</span>}
                  </li>
                );
              })}
            </ul>

            {p.verificationNote && (
              <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "var(--ml-surface-2)", border: "1px solid var(--ml-border-soft)", fontSize: 12.5, lineHeight: 1.55 }}>
                <strong>Last feedback sent:</strong> {p.verificationNote}
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--ml-border-soft)", margin: "16px -20px 0", padding: "16px 20px 0" }}>
              {awaiting ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={pending} onClick={approve}>
                    <Check size={14} />Approve
                  </button>
                  <button className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }} disabled={pending} onClick={() => setRejectOpen(true)}>
                    <X size={14} />Send back
                  </button>
                  <div style={{ fontSize: 12, lineHeight: 1.5, marginTop: 2 }} className="subtle">
                    Approving verifies their credentials and activates the account. They publish their own profile.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Info size={16} style={{ color: "var(--ml-ink-muted)", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ml-ink-2)" }}>
                    {p.verificationStatus === "verified"
                      ? "Already verified, so there is nothing to approve."
                      : "Hasn't submitted credentials yet. They join the queue once they send their documents."}
                    <div style={{ marginTop: 10 }}>
                      <Link className="btn btn-sm" href={`/admin/practitioners/${p.slug}`}>Account details</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Send ${p.fullName}'s submission back`}
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
          Nothing is published. {p.fullName} will receive your feedback and can upload new documents or fix their profile, then resubmit.
        </div>
        <div style={{ fontSize: 12, color: "var(--ml-ink-muted)", marginBottom: 6, fontWeight: 500 }}>
          Feedback for the practitioner <span style={{ color: "var(--ml-danger)" }}>*</span>
        </div>
        <textarea
          className="input input-plain"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Explain what needs fixing — e.g. the document is blurry or expired, doesn't match their name, or the profile needs a photo and a longer bio…"
          style={{ minHeight: 120, height: "auto", padding: "10px 12px", fontFamily: "var(--ml-font)", resize: "vertical" }}
        />
        {gaps.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="label">Auto-detected gaps — tap to add</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {gaps.map((m) => (
                <span
                  key={m}
                  onClick={() => setNote((n) => (n ? n + "\n• " + m : "• " + m))}
                  style={{ padding: "3px 9px", background: "var(--ml-warn-bg)", color: "var(--ml-warn)", borderRadius: 999, fontSize: 11.5, cursor: "pointer" }}
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
