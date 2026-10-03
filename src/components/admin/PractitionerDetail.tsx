"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, ArrowLeft, ExternalLink, Check, Lock, Key, Pencil, Mail, MapPin,
  FileText, Shield, ShieldCheck, Globe, Briefcase, GraduationCap, Video, Download, Eye,
} from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Appointment } from "@/types/appointment";
import type { PractitionerDocument } from "@/types/document";
import type { Feature, FeatureAccessLog } from "@/types/feature";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { ConfirmDialog, Modal, type ConfirmConfig } from "./ui/Overlays";
import { Section, Row, SummaryItem, dash, sectionGrid } from "./ui/Detail";
import { DocumentViewer } from "./ui/DocumentViewer";
import { ReviewHistory } from "./ReviewHistory";
import type { ReviewEvent } from "@/types/reviewEvent";
import { useToast } from "./ui/ToastProvider";
import { bookingStatsFor, publicLinkFor } from "@/lib/admin";
import { formatFeeRange } from "@/lib/fees";
import {
  approveAccount, rejectAccount, suspendAccount, reactivateAccount,
  sendResetLinkAction, updateSlugAction, grantFeatureAction, revokeFeatureAction,
} from "@/app/admin/actions";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "bookings", label: "Bookings" },
  { id: "documents", label: "Documents" },
  { id: "features", label: "Feature access" },
  { id: "activity", label: "Activity" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const BACK_HREF = "/admin/practitioners";

export function PractitionerDetail({
  p,
  appointments,
  documents,
  features,
  accessIds,
  logs,
  history,
  siteUrl,
}: {
  p: Practitioner;
  appointments: Appointment[];
  documents: PractitionerDocument[];
  features: Feature[];
  accessIds: string[];
  logs: FeatureAccessLog[];
  history: ReviewEvent[];
  siteUrl: string;
}) {
  const [tab, setTab] = useState<TabId>("overview");
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [slugEdit, setSlugEdit] = useState(false);
  const [slug, setSlug] = useState(p.slug);
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const publicLink = publicLinkFor(p.slug, siteUrl);
  const stats = bookingStatsFor(p.slug, appointments);

  const doAction = (cfg: ConfirmConfig) => setConfirm(cfg);

  const Actions = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {p.status === "pending" && (
        <>
          <button className="btn btn-sm btn-primary" disabled={pending} onClick={() => doAction({
            title: `Approve ${p.fullName}?`,
            body: "They'll receive an email and gain immediate access to the platform.",
            confirmLabel: "Approve",
            action: () => startTransition(async () => {
              await approveAccount(p.slug);
              addToast(`${p.fullName} approved`, "ok");
              setConfirm(null);
              router.refresh();
            }),
          })}><Check size={13} />Approve</button>
          <button className="btn btn-sm btn-danger" disabled={pending} onClick={() => setRejectOpen(true)}>
            <X size={13} />Reject
          </button>
        </>
      )}
      {p.status === "active" && (
        <button className="btn btn-sm btn-danger" disabled={pending} onClick={() => doAction({
          title: `Suspend ${p.fullName}?`,
          danger: true,
          body: "They will lose access immediately and their public profile will be hidden.",
          confirmLabel: "Suspend account",
          action: () => startTransition(async () => {
            await suspendAccount(p.slug);
            addToast(`${p.fullName} suspended`, "danger");
            setConfirm(null);
            router.refresh();
          }),
        })}><Lock size={13} />Suspend</button>
      )}
      {p.status === "suspended" && (
        <button className="btn btn-sm btn-primary" disabled={pending} onClick={() => doAction({
          title: `Reactivate ${p.fullName}?`,
          body: "They'll regain access. Public profile will need to be manually re-published.",
          confirmLabel: "Reactivate",
          action: () => startTransition(async () => {
            await reactivateAccount(p.slug);
            addToast(`${p.fullName} reactivated`, "ok");
            setConfirm(null);
            router.refresh();
          }),
        })}><Check size={13} />Reactivate</button>
      )}
      <button className="btn btn-sm" disabled={pending} onClick={() => startTransition(async () => {
        const result = await sendResetLinkAction(p.slug);
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
          (result.emailed ? `Link emailed to ${result.email}` : "Email isn't set up, so nothing was sent") +
            (copied ? ". Link copied to your clipboard." : "."),
          result.emailed ? "ok" : "info",
        );
      })}><Key size={13} />Send reset link</button>
      <a className="btn btn-sm" href={`https://${publicLink}`} target="_blank" rel="noreferrer">
        <ExternalLink size={13} />Public profile
      </a>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Link className="btn btn-ghost btn-sm" href={BACK_HREF} style={{ marginLeft: -10 }}><ArrowLeft size={14} />All practitioners</Link>
      </div>

      {/* Identity + actions + at-a-glance summary */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar name={p.fullName} size="lg" />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em" }}>{p.fullName}</h2>
              <Badge kind={p.status} />
              <Badge kind={p.profileStatus} />
              <Badge kind={p.verificationStatus} />
            </div>
            <div style={{ color: "var(--ml-ink-muted)", fontSize: 14, marginTop: 4 }}>{p.professionalTitle}</div>
            <div className="mono" style={{ color: "var(--ml-ink-subtle)", fontSize: 12, marginTop: 6 }}>{publicLink}</div>
          </div>
          {Actions}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", borderTop: "1px solid var(--ml-border-soft)", background: "var(--ml-surface-2)" }}>
          <SummaryItem label="Joined" value={p.dateJoined} />
          <SummaryItem label="Total bookings" value={String(stats.total)} />
          <SummaryItem label="Upcoming" value={String(stats.upcoming)} />
          <SummaryItem label="Experience" value={`${p.experienceYears} ${p.experienceYears === 1 ? "year" : "years"}`} />
          <SummaryItem label="Fee range" value={feeText(p)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ alignSelf: "flex-start" }}>
        {TABS.map((t) => (
          <button key={t.id} className={"tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === "bookings" && <span className="pill tnum">{stats.total}</span>}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          p={p}
          publicLink={publicLink}
          siteUrl={siteUrl}
          slug={slug}
          slugEdit={slugEdit}
          setSlug={setSlug}
          setSlugEdit={setSlugEdit}
          pending={pending}
          onSaveSlug={() => startTransition(async () => {
            const result = await updateSlugAction(p.slug, slug);
            if (!result.ok) { addToast(result.message, "danger"); return; }
            addToast("Slug updated to " + slug, "ok");
            setSlugEdit(false);
            router.replace(`${BACK_HREF}/${slug.trim().toLowerCase()}`);
          })}
        />
      )}
      {tab !== "overview" && (
        <div className="card" style={{ padding: 24 }}>
          {tab === "bookings" && <BookingsTab p={p} appointments={appointments} stats={stats} />}
          {tab === "documents" && <DocumentsTab documents={documents} personName={p.fullName} />}
          {tab === "features" && <FeatureAccessTab p={p} features={features} accessIds={accessIds} />}
          {tab === "activity" && <ActivityTab p={p} logs={logs} history={history} />}
        </div>
      )}

      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Reject ${p.fullName}'s application`}
        width={520}
        footer={
          <>
            <button className="btn" onClick={() => setRejectOpen(false)}>Cancel</button>
            <button
              className="btn btn-danger"
              disabled={!rejectNote.trim() || pending}
              onClick={() => startTransition(async () => {
                await rejectAccount(p.slug, rejectNote);
                addToast(`${p.fullName} rejected`, "danger");
                setRejectOpen(false);
                router.push(BACK_HREF);
              })}
            >
              <X size={13} />Reject application
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginBottom: 10, lineHeight: 1.5 }}>
          They won&apos;t be able to sign in. They&apos;ll see this reason when they try, and can contact the team for help.
        </div>
        <div style={{ fontSize: 12, color: "var(--ml-ink-muted)", marginBottom: 6, fontWeight: 500 }}>
          Reason <span style={{ color: "var(--ml-danger)" }}>*</span>
        </div>
        <textarea
          className="input input-plain"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Explain why this application can't be accepted…"
          style={{ minHeight: 120, height: "auto", padding: "10px 12px", fontFamily: "var(--ml-font)", resize: "vertical" }}
        />
      </Modal>
    </div>
  );
}

function feeText(p: Practitioner): string {
  return formatFeeRange(p.feeRange) ?? "Not set";
}





function OverviewTab({
  p, publicLink, siteUrl, slug, slugEdit, setSlug, setSlugEdit, pending, onSaveSlug,
}: {
  p: Practitioner;
  publicLink: string;
  siteUrl: string;
  slug: string;
  slugEdit: boolean;
  setSlug: (v: string) => void;
  setSlugEdit: (v: boolean) => void;
  pending: boolean;
  onSaveSlug: () => void;
}) {
  return (
    <div style={sectionGrid}>
      <Section icon={<Mail size={15} />} title="Contact">
        <Row label="Email"><span className="mono" style={{ fontSize: 13 }}>{p.email}</span></Row>
        <Row label="Phone">{p.phone ? <span className="mono" style={{ fontSize: 13 }}>{p.phone}</span> : dash}</Row>
        <Row label="Location">{p.location ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={13} style={{ color: "var(--ml-ink-subtle)" }} />{p.location}</span> : dash}</Row>
        <Row label="Website">{p.websiteUrl ? <span className="mono" style={{ fontSize: 13 }}>{p.websiteUrl}</span> : dash}</Row>
      </Section>

      <Section icon={<ShieldCheck size={15} />} title="Account">
        <Row label="Account status"><Badge kind={p.status} /></Row>
        <Row label="Profile status"><Badge kind={p.profileStatus} /></Row>
        <Row label="Verification">
          <Link href={`/admin/pending/${p.slug}`} className="btn btn-ghost btn-sm" style={{ padding: "2px 8px", marginLeft: -8 }}>
            <Badge kind={p.verificationStatus} />
          </Link>
        </Row>
        <Row label="Created via">{p.creationMethod === "super_admin" ? "Super Admin" : "Self sign-up"}</Row>
      </Section>

      <Section icon={<Globe size={15} />} title="Public page">
        <Row label="URL">
          {slugEdit ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span className="mono" style={{ fontSize: 12.5, color: "var(--ml-ink-subtle)" }}>{siteUrl.replace(/^https?:\/\//, "")}/</span>
              <input className="input input-plain mono" style={{ flex: 1, minWidth: 120, height: 32, fontSize: 12.5 }} value={slug} onChange={(e) => setSlug(e.target.value)} />
              <button className="btn btn-sm btn-primary" disabled={pending} onClick={onSaveSlug}>Save</button>
              <button className="btn btn-sm" onClick={() => setSlugEdit(false)}>Cancel</button>
            </div>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span className="mono" style={{ fontSize: 13, color: "var(--ml-accent)" }}>{publicLink}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => setSlugEdit(true)}><Pencil size={12} />Edit</button>
            </span>
          )}
        </Row>
        <Row label="Socials">
          {p.socialLinks.length === 0 ? dash : (
            <span className="mono" style={{ display: "flex", gap: 10, fontSize: 12.5, color: "var(--ml-ink-muted)", flexWrap: "wrap" }}>
              {p.socialLinks.map((l) => <span key={l.platform}>{l.platform}</span>)}
            </span>
          )}
        </Row>
      </Section>

      <Section icon={<Briefcase size={15} />} title="Practice">
        <Row label="Experience">{`${p.experienceYears} ${p.experienceYears === 1 ? "year" : "years"}`}</Row>
        <Row label="Fee range">{formatFeeRange(p.feeRange) ?? dash}</Row>
        <Row label="Session mode">
          <span style={{ display: "flex", gap: 6 }}>
            {p.sessionType !== "offline" && <Badge kind="online" dot={false} />}
            {p.sessionType !== "online" && <Badge kind="onsite" dot={false} />}
          </span>
        </Row>
        <Row label="New bookings">
          {p.acceptingBookings ? <Badge kind="active">Accepting</Badge> : <Badge kind="suspended">Paused by practitioner</Badge>}
        </Row>
        <Row label="Languages">{p.languages.length ? p.languages.join(" · ") : dash}</Row>
      </Section>

      <Section icon={<FileText size={15} />} title="About" span={2}>
        <div style={{ padding: "12px 0 6px", fontSize: 13.5, color: "var(--ml-ink-2)", lineHeight: 1.65 }}>
          {p.bio || <span className="subtle">No bio provided.</span>}
        </div>
        {p.specializations.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 0 8px" }}>
            {p.specializations.map((sp) => (
              <span key={sp} style={{ padding: "3px 10px", background: "var(--ml-accent-tint)", color: "var(--ml-accent-2)", borderRadius: 999, fontSize: 12, fontWeight: 500 }}>{sp}</span>
            ))}
          </div>
        )}
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
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ padding: "10px 12px", border: "1px solid var(--ml-border)", borderRadius: 8, background: "var(--ml-surface-2)" }}>
      <div style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div className="tnum" style={{ fontSize: 22, fontWeight: 600, marginTop: 2, color: color || "var(--ml-ink)" }}>{value}</div>
    </div>
  );
}

function BookingsTab({
  appointments,
  stats,
  p,
}: {
  p: Practitioner;
  appointments: Appointment[];
  stats: { total: number; completed: number; cancelled: number; upcoming: number };
}) {
  const own = appointments.filter((a) => a.practitionerSlug === p.slug).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Completed" value={stats.completed} color="var(--ml-info)" />
        <MiniStat label="Upcoming" value={stats.upcoming} color="var(--ml-ok)" />
        <MiniStat label="Cancelled" value={stats.cancelled} color="var(--ml-danger)" />
      </div>
      {own.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "var(--ml-ink-subtle)", fontSize: 13 }}>No bookings yet.</div>
      ) : (
        <div style={{ border: "1px solid var(--ml-border)", borderRadius: 8, overflow: "hidden" }}>
          {own.map((b, i) => (
            <div key={b.id} style={{
              display: "grid", gridTemplateColumns: "80px 80px 1fr 100px 120px",
              alignItems: "center", padding: "10px 14px",
              borderBottom: i === own.length - 1 ? "none" : "1px solid var(--ml-border-soft)",
              fontSize: 13, background: "var(--ml-surface)",
            }}>
              <div className="mono tnum" style={{ color: "var(--ml-ink-muted)", fontSize: 12 }}>{b.date}</div>
              <div className="mono tnum" style={{ fontSize: 12 }}>{b.startTime}</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--ml-ink-muted)" }}>{b.clientId}</div>
              <div style={{ fontSize: 12, color: "var(--ml-ink-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                {b.sessionType === "online" ? <Video size={12} /> : <MapPin size={12} />}
                {b.sessionType === "online" ? "Online" : "On-Site"}
              </div>
              <Badge kind={b.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ documents, personName }: { documents: PractitionerDocument[]; personName: string }) {
  const [viewDoc, setViewDoc] = useState<PractitionerDocument | null>(null);
  const addToast = useToast();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginBottom: 4 }}>
        {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded for verification
      </div>
      {documents.length === 0 && <div className="subtle" style={{ fontSize: 13 }}>No documents uploaded.</div>}
      {documents.map((d) => (
        <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "1px solid var(--ml-border)", borderRadius: 8, background: "var(--ml-surface)" }}>
          <div style={{ width: 34, height: 34, borderRadius: 7, background: "var(--ml-surface-3)", display: "grid", placeItems: "center", color: "var(--ml-ink-muted)", flexShrink: 0 }}>
            <FileText size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }} className="truncate">{d.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)", display: "flex", gap: 8, marginTop: 1 }}>
              <span>{d.category}</span>
            </div>
          </div>
          <button className="btn btn-sm" onClick={() => setViewDoc(d)}><Eye size={13} />View</button>
          {d.hasFile ? (
            <a className="btn btn-sm btn-ghost" href={`/documents/${d.id}?download=1`} title={"Download " + d.name}><Download size={13} /></a>
          ) : (
            <button className="btn btn-sm btn-ghost" onClick={() => addToast("This demo record has no file attached", "info")}><Download size={13} /></button>
          )}
        </div>
      ))}
      <DocumentViewer docs={documents} active={viewDoc} onSelect={setViewDoc} onClose={() => setViewDoc(null)} personName={personName} />
    </div>
  );
}

function FeatureAccessTab({
  p,
  features,
  accessIds,
}: {
  p: Practitioner;
  features: Feature[];
  accessIds: string[];
}) {
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const enabled = features.filter((f) => accessIds.includes(f.id));
  const disabled = features.filter((f) => !accessIds.includes(f.id));

  const toggle = (f: Feature, grant: boolean) => startTransition(async () => {
    if (grant) await grantFeatureAction(p.slug, f.id);
    else await revokeFeatureAction(p.slug, f.id);
    addToast((grant ? "Enabled " : "Revoked ") + f.name + " for " + p.fullName, grant ? "ok" : "danger");
    router.refresh();
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div className="h3">Enabled features</div>
          <span className="tnum" style={{ fontSize: 12, color: "var(--ml-ink-subtle)" }}>{enabled.length} of {features.length}</span>
        </div>
        {enabled.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--ml-ink-subtle)", fontStyle: "italic" }}>No features enabled.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {enabled.map((f) => (
              <FeatureRow key={f.id} f={f} enabled disabled={pending} onToggle={() => toggle(f, false)} />
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "var(--ml-border)" }} />

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div className="h3">Disabled features</div>
          <span className="tnum" style={{ fontSize: 12, color: "var(--ml-ink-subtle)" }}>{disabled.length} of {features.length}</span>
        </div>
        {disabled.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--ml-ink-subtle)", fontStyle: "italic" }}>All features enabled.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {disabled.map((f) => (
              <FeatureRow key={f.id} f={f} enabled={false} disabled={pending} onToggle={() => toggle(f, true)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureRow({
  f, enabled, disabled, onToggle,
}: {
  f: Feature;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
      border: "1px solid var(--ml-border)", borderRadius: 8,
      background: enabled ? "var(--ml-surface)" : "var(--ml-surface-2)",
      opacity: enabled ? 1 : 0.75,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 7,
        background: enabled ? "var(--ml-accent-tint)" : "var(--ml-surface-3)",
        display: "grid", placeItems: "center",
        color: enabled ? "var(--ml-accent)" : "var(--ml-ink-subtle)", flexShrink: 0,
      }}>
        <Shield size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ml-ink)" }}>{f.name}</div>
      </div>
      {enabled
        ? <button className="btn btn-sm btn-danger" disabled={disabled} onClick={onToggle}><X size={13} />Revoke</button>
        : <button className="btn btn-sm btn-primary" disabled={disabled} onClick={onToggle}><Check size={13} />Enable</button>}
    </div>
  );
}

function ActivityTab({ p, logs, history }: { p: Practitioner; logs: FeatureAccessLog[]; history: ReviewEvent[] }) {
  // Older accounts have no recorded decisions, so fall back to the dates stored on the practitioner.
  const hasEvent = (kind: ReviewEvent["kind"]) => history.some((e) => e.kind === kind);
  const items = [
    p.lastSignIn && { t: p.lastSignIn, action: "Signed in", kind: "info" as const },
    !hasEvent("account_approved") && p.approvedOn && { t: p.approvedOn, action: "Account approved by Super Admin", kind: "ok" as const },
    { t: p.dateJoined, action: "Account created · " + (p.creationMethod === "super_admin" ? "by Super Admin" : "self sign-up"), kind: "info" as const },
    !hasEvent("account_suspended") && p.status === "suspended" && p.suspendedOn && { t: p.suspendedOn, action: "Account suspended" + (p.rejectionNote ? ` — ${p.rejectionNote}` : ""), kind: "danger" as const },
  ].filter((x): x is { t: string; action: string; kind: "info" | "ok" | "danger" } => !!x);

  const ownLogs = logs.filter((l) => l.practitionerSlug === p.slug);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, border: "1px solid var(--ml-border)", borderRadius: 8, overflow: "hidden", background: "var(--ml-surface)" }}>
        <div style={{ padding: "10px 14px", borderRight: "1px solid var(--ml-border)" }}>
          <div className="label" style={{ marginBottom: 4 }}>Date joined</div>
          <div className="mono tnum" style={{ fontSize: 13 }}>{p.dateJoined}</div>
        </div>
        <div style={{ padding: "10px 14px", borderRight: "1px solid var(--ml-border)" }}>
          <div className="label" style={{ marginBottom: 4 }}>Last sign-in</div>
          <div className="mono tnum" style={{ fontSize: 13 }}>{p.lastSignIn ?? "—"}</div>
        </div>
        <div style={{ padding: "10px 14px" }}>
          <div className="label" style={{ marginBottom: 4 }}>Approved on</div>
          <div className="mono tnum" style={{ fontSize: 13 }}>{p.approvedOn ?? "—"}</div>
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: 10 }}>Review decisions</div>
          <ReviewHistory events={history} />
        </div>
      )}

      <div style={{ borderLeft: "1px solid var(--ml-border)", marginLeft: 6, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => {
          const dotColor = it.kind === "ok" ? "var(--ml-ok)" : it.kind === "danger" ? "var(--ml-danger)" : "var(--ml-info)";
          return (
            <div key={i} style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: -22, top: 6, width: 8, height: 8, borderRadius: 50, background: dotColor, border: "2px solid var(--ml-bg)" }} />
              <div className="mono" style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)" }}>{it.t}</div>
              <div style={{ fontSize: 13.5, marginTop: 1 }}>{it.action}</div>
            </div>
          );
        })}
        {ownLogs.map((l) => (
          <div key={l.id} style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: -22, top: 6, width: 8, height: 8, borderRadius: 50, background: "var(--ml-accent)", border: "2px solid var(--ml-bg)" }} />
            <div className="mono" style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)" }}>{l.at.slice(0, 16).replace("T", " ")}</div>
            <div style={{ fontSize: 13.5, marginTop: 1 }}>
              {l.action === "granted" ? "Feature access granted" : "Feature access revoked"} — {l.featureId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
