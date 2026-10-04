"use client";

import { Fragment, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Check, Lock, Key, Pencil, Mail, MapPin,
  FileText, Shield, ShieldCheck, Globe, Video, Download, Eye,
} from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Appointment } from "@/types/appointment";
import type { PractitionerDocument } from "@/types/document";
import { Avatar } from "./ui/Avatar";
import { Badge, ProfileBadge, VerificationBadge } from "./ui/Badge";
import { canReactivate, canReactivateLive, canSuspend, headlineKey } from "@/lib/practitionerState";
import { ConfirmDialog, Modal, type ConfirmConfig } from "./ui/Overlays";
import { Section, Row, SummaryItem, dash } from "./ui/Detail";
import { DocumentViewer } from "./ui/DocumentViewer";
import { SlidingTabs } from "./ui/SlidingTabs";
import { ReviewHistory } from "./ReviewHistory";
import type { ReviewEvent } from "@/types/reviewEvent";
import { useToast } from "./ui/ToastProvider";
import { bookingStatsFor, publicLinkFor } from "@/lib/admin";
import { formatFeeRange } from "@/lib/fees";
import { COLOR_THEMES, DEFAULT_COLOR_THEME } from "@/lib/themes";
import {
  suspendAccount, reactivateAccount,
  sendResetLinkAction, updateSlugAction,
} from "@/app/admin/actions";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "account", label: "Account Details" },
  { id: "bookings", label: "Bookings" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const BACK_HREF = "/admin/practitioners";

export function PractitionerDetail({
  p,
  appointments,
  documents,
  history,
  siteUrl,
}: {
  p: Practitioner;
  appointments: Appointment[];
  documents: PractitionerDocument[];
  history: ReviewEvent[];
  siteUrl: string;
}) {
  const [tab, setTab] = useState<TabId>("overview");
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [goLive, setGoLive] = useState(false);
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
      {canSuspend(p) && (
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
      {canReactivate(p) && (
        <button className="btn btn-sm btn-primary" disabled={pending} onClick={() => { setGoLive(false); setReactivateOpen(true); }}>
          <Check size={13} />Reactivate
        </button>
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
      })}><Key size={13} />{headlineKey(p) === "invite_not_sent" ? "Send invite" : "Send reset link"}</button>
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

      {/* Identity + actions, then a status and numbers strip */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar name={p.fullName} size="xl" photoUrl={p.photoUrl} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>{p.fullName}</h2>
            <div style={{ color: "var(--ml-ink-muted)", fontSize: 15, marginTop: 4 }}>{p.professionalTitle}</div>
          </div>
          {Actions}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", borderTop: "1px solid var(--ml-border-soft)", background: "var(--ml-surface-2)" }}>
          <SummaryItem label="Account" value={<Badge kind={p.status} />} />
          <SummaryItem label="Profile" value={<ProfileBadge p={p} />} />
          <SummaryItem label="Verification" value={<VerificationBadge p={p} />} />
          <SummaryItem label="Joined" value={p.dateJoined} />
          <SummaryItem label="Total bookings" value={String(stats.total)} />
        </div>
      </div>

      {/* Tabs: the baseline runs the full width and the content sits right under it */}
      <SlidingTabs
        label="Practitioner sections"
        tabs={TABS.map((t) => (t.id === "bookings" ? { ...t, count: stats.total } : t))}
        value={tab}
        onChange={setTab}
      />

      {tab === "account" && (
        <AccountDetailsTab
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
      {tab === "overview" && <OverviewTab p={p} />}
      {tab !== "overview" && (
        // Joined to the tab baseline above: the card starts exactly where the line is, with square top corners.
        <div className="card" style={{ padding: 24, marginTop: -16, borderRadius: "0 0 16px 16px" }}>
          {tab === "bookings" && <BookingsTab p={p} appointments={appointments} stats={stats} />}
          {tab === "documents" && <DocumentsTab documents={documents} personName={p.fullName} />}
          {tab === "activity" && <ActivityTab p={p} history={history} />}
        </div>
      )}

      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />

      <Modal
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        title={`Reactivate ${p.fullName}?`}
        width={500}
        footer={
          <>
            <button className="btn" onClick={() => setReactivateOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={pending}
              onClick={() => startTransition(async () => {
                await reactivateAccount(p.slug, goLive);
                addToast(`${p.fullName} reactivated${goLive ? " and live" : ""}`, "ok");
                setReactivateOpen(false);
                router.refresh();
              })}
            >
              <Check size={13} />Reactivate
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginBottom: 12, lineHeight: 1.5 }}>
          They regain access to their account. Choose what happens to their public profile:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { live: true, title: "Make the profile live straight away", body: "It goes back online immediately.", disabled: !canReactivateLive(p) },
            { live: false, title: "Keep it offline", body: "They publish it again themselves when they are ready.", disabled: false },
          ].map((o) => (
            <label key={String(o.live)} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", borderRadius: 10, cursor: o.disabled ? "not-allowed" : "pointer", opacity: o.disabled ? 0.55 : 1, boxShadow: goLive === o.live && !o.disabled ? "0 0 0 2px var(--ml-accent)" : "0 0 0 1px var(--ml-ring)" }}>
              <input type="radio" name="reactivate-mode" checked={goLive === o.live} disabled={o.disabled} onChange={() => setGoLive(o.live)} style={{ marginTop: 3, accentColor: "var(--ml-accent)" }} />
              <span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>{o.title}</span>
                <span style={{ display: "block", fontSize: 12.5, color: "var(--ml-ink-muted)", marginTop: 2 }}>
                  {o.disabled ? "Not available: their credentials are not verified." : o.body}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      {title && <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ml-ink)", marginBottom: 8 }}>{title}</div>}
      {items.length === 0 ? (
        <div className="subtle" style={{ fontSize: 13 }}>{empty}</div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it, i) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "var(--ml-ink-2)", lineHeight: 1.5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--ml-accent)", marginTop: 8, flexShrink: 0 }} />
              <span style={{ minWidth: 0, wordBreak: "break-word" }}>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((it) => (
        <span key={it} style={{ padding: "3px 10px", background: "var(--ml-accent-tint)", color: "var(--ml-accent-2)", borderRadius: 999, fontSize: 12, fontWeight: 500 }}>{it}</span>
      ))}
    </div>
  );
}

/** One row of the profile sheet: the section name on the left, its content on the right. */
function SheetRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sheet-row">
      <div className="sheet-label">{label}</div>
      <div className="sheet-body">{children}</div>
    </div>
  );
}

const none = (text: string) => <span className="subtle">{text}</span>;

/**
 * The public profile as one sheet, in the order the page itself reads, one section per row, all in the same
 * label-and-content shape. Only what the page shows.
 */
function OverviewTab({ p }: { p: Practitioner }) {
  const theme = COLOR_THEMES.find((t) => t.id === (p.colorTheme ?? DEFAULT_COLOR_THEME));
  const contacts = p.contactMethods.filter((c) => c.isPublic && c.value);
  // The page only shows an address for practitioners who see clients in person.
  const location = p.sessionType === "online" ? undefined : p.location;
  const hasReach = contacts.length > 0 || !!p.websiteUrl || !!location || p.socialLinks.length > 0;
  const platform = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

  return (
    <div className="card sheet">
      <SheetRow label="At a glance">
        <div className="sheet-facts">
          <div><span>Experience</span>{`${p.experienceYears} ${p.experienceYears === 1 ? "year" : "years"}`}</div>
          <div><span>Fee range</span>{formatFeeRange(p.feeRange) ?? "Not set"}</div>
          <div>
            <span>Session mode</span>
            <span style={{ display: "flex", gap: 8 }}>
              {p.sessionType !== "offline" && <Badge kind="online" dot={false} />}
              {p.sessionType !== "online" && <Badge kind="onsite" dot={false} />}
            </span>
          </div>
          <div><span>New bookings</span>{p.acceptingBookings ? <Badge kind="active">Accepting</Badge> : <Badge kind="suspended">Paused</Badge>}</div>
          <div><span>Colour theme</span>{theme?.name ?? "Default"}</div>
        </div>
      </SheetRow>

      <SheetRow label="About">
        {p.shortBio && <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ml-ink)", lineHeight: 1.5, marginBottom: 10 }}>{p.shortBio}</div>}
        <div style={{ fontSize: 14, color: "var(--ml-ink-2)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{p.bio || none("No bio provided.")}</div>
      </SheetRow>

      <SheetRow label="Areas of expertise">{p.specializations.length ? <Chips items={p.specializations} /> : none("None added.")}</SheetRow>

      <SheetRow label="Services offered">{p.services.length ? <Chips items={p.services} /> : none("None added.")}</SheetRow>

      <SheetRow label="Work experience"><ListBlock title="" items={p.workExperience ?? []} empty="No work experience listed." /></SheetRow>

      <SheetRow label="Education"><ListBlock title="" items={p.education} empty="No education listed." /></SheetRow>

      <SheetRow label="Reach out">
        {!hasReach ? none("No contact details added.") : (
          <dl className="sheet-dl">
            {location && <><dt>Location</dt><dd>{location}</dd></>}
            {contacts.map((c) => <Fragment key={c.label}><dt>{c.label}</dt><dd className="mono">{c.value}</dd></Fragment>)}
            {p.websiteUrl && <><dt>Website</dt><dd className="mono">{p.websiteUrl}</dd></>}
            {p.socialLinks.map((l) => (
              <Fragment key={l.platform}>
                <dt>{platform(l.platform)}</dt>
                <dd><a href={l.url} target="_blank" rel="noreferrer" className="mono" style={{ color: "var(--ml-accent)", wordBreak: "break-all" }}>{l.url}</a></dd>
              </Fragment>
            ))}
          </dl>
        )}
      </SheetRow>

      {p.noteForClients && (
        <SheetRow label="Note for clients">
          <div style={{ fontSize: 14, color: "var(--ml-ink-2)", lineHeight: 1.7, fontStyle: "italic", whiteSpace: "pre-line" }}>{p.noteForClients}</div>
        </SheetRow>
      )}
    </div>
  );
}

function AccountDetailsTab({
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
  const invite = headlineKey(p);
  const signIn =
    p.hasLogin === false ? "No sign-in account yet: send the invite"
    : p.emailUnconfirmed ? (p.creationMethod === "super_admin" ? "Invite sent, password not set yet" : "Email not confirmed yet")
    : "Confirmed";
  return (
    <div className="detail-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <Section icon={<ShieldCheck size={15} />} title="Account">
          <Row label="Status"><Badge kind={p.status} /></Row>
          <Row label="Created via">{p.creationMethod === "super_admin" ? "Super Admin" : "Self sign-up"}</Row>
          <Row label="Date joined"><span className="tnum">{p.dateJoined}</span></Row>
          <Row label="Last sign-in">{p.lastSignIn ? <span className="tnum">{p.lastSignIn}</span> : dash}</Row>
          {p.status === "suspended" && <Row label="Suspended on">{p.suspendedOn ? <span className="tnum">{p.suspendedOn}</span> : dash}</Row>}
        </Section>

        <Section icon={<Mail size={15} />} title="Sign-in">
          <Row label="Email"><span className="mono" style={{ fontSize: 13 }}>{p.email}</span></Row>
          <Row label="Email status">
            <span style={{ color: invite === "invite_not_sent" ? "var(--ml-warn)" : undefined, fontWeight: invite === "invite_not_sent" ? 600 : undefined }}>{signIn}</span>
          </Row>
        </Section>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <Section icon={<Shield size={15} />} title="Verification">
          <Row label="Status">
            <Link href={`/admin/pending/${p.slug}`} className="btn btn-ghost btn-sm" style={{ padding: "2px 8px", marginLeft: -8 }}>
              <VerificationBadge p={p} />
            </Link>
          </Row>
          <Row label="Submitted">{p.verificationSubmittedAt ? <span className="tnum">{p.verificationSubmittedAt.slice(0, 10)}</span> : dash}</Row>
          <Row label="Verified on">{p.verifiedOn ? <span className="tnum">{p.verifiedOn}</span> : dash}</Row>
          {p.verificationNote && <Row label="Last reason">{p.verificationNote}</Row>}
        </Section>

        <Section icon={<Globe size={15} />} title="Public page">
          <Row label="Profile"><ProfileBadge p={p} /></Row>
          <Row label="URL">
            {slugEdit ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--ml-ink-subtle)" }}>{siteUrl.replace(/^https?:\/\//, "")}/</span>
                <input className="input input-plain mono" style={{ flex: 1, minWidth: 120, height: 32, fontSize: 12.5 }} value={slug} onChange={(e) => setSlug(e.target.value)} />
                <button className="btn btn-sm btn-primary" disabled={pending} onClick={onSaveSlug}>Save</button>
                <button className="btn btn-sm" onClick={() => setSlugEdit(false)}>Cancel</button>
              </div>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: 13, color: "var(--ml-accent)" }}>{publicLink}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => setSlugEdit(true)}><Pencil size={12} />Edit</button>
              </span>
            )}
          </Row>
          <Row label="Socials">
            {p.socialLinks.length === 0 ? dash : (
              <span style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--ml-ink-muted)", flexWrap: "wrap", textTransform: "capitalize" }}>
                {p.socialLinks.map((l) => <span key={l.platform}>{l.platform}</span>)}
              </span>
            )}
          </Row>
        </Section>
      </div>
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
  stats: { total: number; completed: number; cancelled: number };
}) {
  const own = appointments.filter((a) => a.practitionerSlug === p.slug).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Completed" value={stats.completed} color="var(--ml-info)" />
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

function ActivityTab({ p, history }: { p: Practitioner; history: ReviewEvent[] }) {
  // Older accounts have no recorded decisions, so fall back to the dates stored on the practitioner.
  const hasEvent = (kind: ReviewEvent["kind"]) => history.some((e) => e.kind === kind);
  type Item = { t: string; action: string; kind: "info" | "ok" | "danger" };
  const items = ([
    p.lastSignIn && { t: p.lastSignIn, action: "Signed in", kind: "info" as const },
    { t: p.dateJoined, action: "Account created · " + (p.creationMethod === "super_admin" ? "by Super Admin" : "self sign-up"), kind: "info" as const },
    !hasEvent("account_suspended") && p.status === "suspended" && p.suspendedOn && { t: p.suspendedOn, action: "Account suspended" + (p.rejectionNote ? ` — ${p.rejectionNote}` : ""), kind: "danger" as const },
  ] as (Item | false | "" | undefined)[]).filter((x): x is Item => !!x);

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
      </div>
    </div>
  );
}
