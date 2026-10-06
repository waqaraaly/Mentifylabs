"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Check, Lock, Key, Pencil, Mail, MapPin,
  FileText, Shield, ShieldCheck, Trash2, Globe, Video, Briefcase, Brain, GraduationCap,
} from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Appointment } from "@/types/appointment";
import type { PractitionerDocument } from "@/types/document";
import { Avatar } from "./ui/Avatar";
import { Badge, ProfileBadge, VerificationBadge } from "./ui/Badge";
import { isLive, canDecideSubmission, canResendConfirmation, canReactivate, canReactivateLive, canSuspend, headlineKey } from "@/lib/practitionerState";
import { ConfirmDialog, Modal, type ConfirmConfig } from "./ui/Overlays";
import { SummaryItem, dash } from "./ui/Detail";
import { DocumentList } from "./ui/DocumentList";
import { SheetGroup, Field, ActionRow } from "./ui/Sheet";
import { SlidingTabs } from "./ui/SlidingTabs";
import { REVIEW_EVENT_LABELS, type ReviewEvent } from "@/types/reviewEvent";
import { verificationState } from "@/lib/verification";
import { useToast } from "./ui/ToastProvider";
import { appointmentStatsFor, publicLinkFor } from "@/lib/admin";
import { formatFeeRange } from "@/lib/fees";
import { COLOR_THEMES, DEFAULT_COLOR_THEME } from "@/lib/themes";
import {
  suspendAccount, reactivateAccount, deletePractitionerAction, approveSubmissionAction, rejectSubmissionAction, resendConfirmationEmailAction,
  sendResetLinkAction, updateSlugAction,
} from "@/app/admin/actions";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "account", label: "Account Details" },
  { id: "appointments", label: "Appointments" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity" },
  { id: "actions", label: "Actions" },
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
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const [reason, setReason] = useState("");
  const [slugEdit, setSlugEdit] = useState(false);
  const handleChosen = Boolean(p.slugChosenAt);
  const [slug, setSlug] = useState(handleChosen ? p.slug : "");
  const [pending, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const publicLink = publicLinkFor(p.slug, siteUrl);
  const stats = appointmentStatsFor(p.slug, appointments);

  const doAction = (cfg: ConfirmConfig) => setConfirm(cfg);

  // ---- everything Super Admin can do to this practitioner, in one place ----
  const suspend = () => doAction({
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
  });

  const approve = () => doAction({
    title: `Approve ${p.fullName}'s credentials?`,
    body: "They become verified and can publish their profile. They'll be told by email.",
    confirmLabel: "Approve",
    action: () => startTransition(async () => {
      await approveSubmissionAction(p.slug);
      addToast(`${p.fullName} verified`, "ok");
      setConfirm(null);
      router.refresh();
    }),
  });

  const sendLink = () => startTransition(async () => {
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
  });

  const linkKey = headlineKey(p);
  const linkLabel = linkKey === "invite_not_sent" ? "Send invite" : linkKey === "invite_sent" ? "Resend invite" : "Send reset link";
  const linkText =
    linkKey === "invite_not_sent" ? "They have never been invited. This creates their sign-in account and emails them an invitation."
    : linkKey === "invite_sent" ? "They were invited but haven't set a password yet. This sends a fresh invitation and ends the old link."
    : "Emails them a one-time link to choose a new password. Use it if they're locked out or have forgotten it.";

  const actionsPanel = (
    <div className="card sheet">
      <SheetGroup icon={<ShieldCheck size={14} />} title="Account" />
      {canSuspend(p) && (
        <ActionRow title="Suspend account" text="Signs them out straight away and takes their public profile offline until you reactivate the account.">
          <button className="btn btn-danger" disabled={pending} onClick={suspend}><Lock size={14} />Suspend</button>
        </ActionRow>
      )}
      {canReactivate(p) && (
        <ActionRow title="Reactivate account" text="Gives them back access. You choose whether the public profile goes live again straight away or stays offline.">
          <button className="btn btn-primary" disabled={pending} onClick={() => { setGoLive(false); setReactivateOpen(true); }}><Check size={14} />Reactivate</button>
        </ActionRow>
      )}

      <SheetGroup icon={<Shield size={14} />} title="Credentials" />
      {canDecideSubmission(p) ? (
        <ActionRow title="Review credentials" text="Their documents are waiting for your decision. Approving lets them publish their profile; sending back lets them fix and resubmit.">
          <button className="btn btn-primary" disabled={pending} onClick={approve}><Check size={14} />Approve</button>
          <button className="btn btn-danger" disabled={pending} onClick={() => { setReason(""); setSendBackOpen(true); }}>Send back</button>
        </ActionRow>
      ) : (
        <ActionRow title="Review credentials" text={p.verificationStatus === "verified" ? "Their credentials are verified. Nothing is waiting for you." : "Nothing is waiting for review. A decision is possible once they submit credentials."}>
          <span className="subtle">No action needed</span>
        </ActionRow>
      )}

      <SheetGroup icon={<Mail size={14} />} title="Sign-in" />
      <ActionRow title={linkLabel} text={linkText}>
        <button className="btn" disabled={pending} onClick={sendLink}><Key size={14} />{linkLabel}</button>
      </ActionRow>
      {canResendConfirmation(p) && (
        <ActionRow title="Resend confirmation email" text="They signed up but haven't confirmed their email address. This sends the confirmation link again.">
          <button className="btn" disabled={pending} onClick={() => startTransition(async () => {
            const result = await resendConfirmationEmailAction(p.slug);
            addToast(result.message, result.ok ? "ok" : "danger");
          })}><Mail size={14} />Resend confirmation</button>
        </ActionRow>
      )}

      <SheetGroup icon={<Globe size={14} />} title="Public page" />
      <ActionRow
        title="Open public profile"
        text={!handleChosen ? "They haven't chosen a profile link yet, so there is no page to open." : isLive(p) ? "Opens their live page in a new tab." : "Opens their page address. It shows \"not found\" to visitors until the profile is live."}
      >
        {handleChosen ? (
          <a className="btn" href={`https://${publicLink}`} target="_blank" rel="noreferrer"><ExternalLink size={14} />Open page</a>
        ) : (
          <span className="subtle">Not available</span>
        )}
      </ActionRow>

      <SheetGroup icon={<Trash2 size={14} />} title="Danger zone" />
      <ActionRow
        title="Delete account"
        text="Permanently deletes this practitioner: their profile, sign-in, appointments, documents and activity history. This cannot be undone. It is refused while they have upcoming appointments."
      >
        <button className="btn btn-danger" disabled={pending} onClick={() => { setDeleteName(""); setDeleteOpen(true); }}><Trash2 size={14} />Delete account</button>
      </ActionRow>
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
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", borderTop: "1px solid var(--ml-border-soft)", background: "var(--ml-surface-2)" }}>
          <SummaryItem label="Account" value={<Badge kind={p.status} />} />
          <SummaryItem label="Profile" value={<ProfileBadge p={p} />} />
          <SummaryItem label="Verification" value={<VerificationBadge p={p} />} />
          <SummaryItem label="Joined" value={whenLabel(p.dateJoined)} />
          <SummaryItem label="Last sign-in" value={p.lastSignIn ? whenLabel(p.lastSignIn) : "Never"} />
        </div>
      </div>

      {/* Tabs: the baseline runs the full width and the content sits right under it */}
      <SlidingTabs
        label="Practitioner sections"
        // A dot marks the tab when something is waiting for a decision.
        tabs={TABS.map((t) => (t.id === "actions" ? { ...t, attention: canDecideSubmission(p) || linkKey === "invite_not_sent" } : t))}
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
      {tab === "actions" && actionsPanel}
      {tab !== "overview" && tab !== "account" && tab !== "actions" && (
        // Joined to the tab baseline above: the card starts exactly where the line is, with square top corners.
        <div className="card" style={{ padding: 24, marginTop: -16, borderRadius: "0 0 16px 16px" }}>
          {tab === "appointments" && <AppointmentsTab p={p} appointments={appointments} stats={stats} />}
          {tab === "documents" && <DocumentsTab documents={documents} personName={p.fullName} />}
          {tab === "activity" && <ActivityTab p={p} history={history} documents={documents} />}
        </div>
      )}

      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={`Delete ${p.fullName}?`}
        width={540}
        footer={
          <>
            <button className="btn" onClick={() => setDeleteOpen(false)}>Cancel</button>
            <button
              className="btn btn-danger"
              disabled={pending || deleteName.trim().toLowerCase() !== p.fullName.trim().toLowerCase()}
              onClick={() => startTransition(async () => {
                const result = await deletePractitionerAction(p.slug, deleteName);
                if (!result.ok) { addToast(result.message, "danger"); return; }
                addToast(result.message, "danger");
                setDeleteOpen(false);
                router.push(BACK_HREF);
              })}
            >
              <Trash2 size={14} />Delete permanently
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13.5, color: "var(--ml-ink-2)", lineHeight: 1.6, marginBottom: 14 }}>
          This permanently removes {p.fullName} and cannot be undone. All of this goes with them:
        </div>
        <ul style={{ margin: "0 0 16px", paddingLeft: 20, fontSize: 13.5, color: "var(--ml-ink-2)", lineHeight: 1.8 }}>
          <li>their profile and public page{handleChosen ? ` (${publicLink})` : ""}</li>
          <li>their sign-in account</li>
          <li>{stats.total} {stats.total === 1 ? "appointment" : "appointments"}, with their clients&apos; details</li>
          <li>{documents.length} uploaded {documents.length === 1 ? "document" : "documents"} and their photo</li>
          <li>their activity history</li>
        </ul>
        <div style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginBottom: 6, fontWeight: 500 }}>
          Type <strong style={{ color: "var(--ml-ink)" }}>{p.fullName}</strong> to confirm
        </div>
        <input className="input input-plain" value={deleteName} onChange={(e) => setDeleteName(e.target.value)} autoComplete="off" spellCheck={false} />
      </Modal>


      <Modal
        open={sendBackOpen}
        onClose={() => setSendBackOpen(false)}
        title={`Send ${p.fullName}'s credentials back`}
        width={520}
        footer={
          <>
            <button className="btn" onClick={() => setSendBackOpen(false)}>Cancel</button>
            <button
              className="btn btn-danger"
              disabled={pending}
              onClick={() => startTransition(async () => {
                await rejectSubmissionAction(p.slug, reason);
                addToast(`Sent back to ${p.fullName}`, "danger");
                setSendBackOpen(false);
                router.refresh();
              })}
            >
              Send back
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginBottom: 12, lineHeight: 1.5 }}>
          They can upload new documents and resubmit. They&apos;ll see your reason.
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginBottom: 6, fontWeight: 500 }}>
          Reason <span style={{ fontWeight: 400, color: "var(--ml-ink-subtle)" }}>(optional)</span>
        </div>
        <textarea
          className="input input-plain"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What do they need to fix or provide?"
          style={{ minHeight: 110, height: "auto", padding: "10px 12px", fontFamily: "var(--ml-font)", resize: "vertical" }}
        />
      </Modal>


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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((it) => (
        <span key={it} style={{ padding: "5px 13px", background: "var(--ml-accent-tint)", color: "var(--ml-accent-2)", borderRadius: 999, fontSize: 13, fontWeight: 500 }}>{it}</span>
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
 * The public profile as one sheet, in the order the page itself reads, one field per row, all in the same
 * label-and-content shape. Every field the page can show is listed, with "Not added" when it is empty, so
 * nothing is silently missing. Only fields the page uses appear here.
 */
function OverviewTab({ p }: { p: Practitioner }) {
  const theme = COLOR_THEMES.find((t) => t.id === (p.colorTheme ?? DEFAULT_COLOR_THEME));
  const contact = (label: "Email" | "Phone") => p.contactMethods.find((c) => c.label === label && c.value);
  const email = contact("Email");
  const phone = contact("Phone");
  const platform = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);
  // Same dot-and-text status style as everywhere else in the portal.
  const visibility = (c: { isPublic: boolean }) => (c.isPublic ? <Badge kind="active">Public</Badge> : <Badge kind="draft">Private</Badge>);
  const contactValue = (c: ReturnType<typeof contact>) =>
    c ? (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="mono">{c.value}</span>
        {visibility(c)}
      </span>
    ) : none("Not added");

  return (
    <div className="card sheet">
      <SheetGroup icon={<Briefcase size={14} />} title="Practice" />
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
          <div><span>New appointments</span>{p.acceptingBookings ? <Badge kind="active">Accepting</Badge> : <Badge kind="suspended">Paused</Badge>}</div>
          <div><span>Colour theme</span>{theme?.name ?? "Default"}</div>
        </div>
      </SheetRow>

      <SheetGroup icon={<FileText size={14} />} title="About" />
      <SheetRow label="Short bio">
        {p.shortBio ? <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ml-ink)", lineHeight: 1.5 }}>{p.shortBio}</div> : none("Not added")}
      </SheetRow>

      <SheetRow label="Bio">
        <div style={{ fontSize: 14, color: "var(--ml-ink-2)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{p.bio?.trim() ? p.bio : none("Not added")}</div>
      </SheetRow>

      <SheetGroup icon={<Brain size={14} />} title="Expertise" />
      <SheetRow label="Areas of expertise">{p.specializations.length ? <Chips items={p.specializations} /> : none("Not added")}</SheetRow>

      <SheetRow label="Services offered">{p.services.length ? <Chips items={p.services} /> : none("Not added")}</SheetRow>

      <SheetGroup icon={<GraduationCap size={14} />} title="Professional journey" />
      <SheetRow label="Work experience"><ListBlock title="" items={p.workExperience ?? []} empty="Not added" /></SheetRow>

      <SheetRow label="Education"><ListBlock title="" items={p.education} empty="Not added" /></SheetRow>

      <SheetGroup icon={<Mail size={14} />} title="Reaching clients" />
      <SheetRow label="Note for clients">
        {p.noteForClients?.trim()
          ? <div style={{ fontSize: 14, color: "var(--ml-ink-2)", lineHeight: 1.7, fontStyle: "italic", whiteSpace: "pre-line" }}>{p.noteForClients}</div>
          : none("Not added")}
      </SheetRow>

      <SheetRow label="Reach out">
        <dl className="sheet-dl">
          <dt>Location</dt>
          <dd>
            {p.location ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span>{p.location}</span>
                {p.sessionType === "online" && <span className="subtle" style={{ fontSize: 12.5 }}>Not shown: online only</span>}
              </span>
            ) : none("Not added")}
          </dd>
          <dt>Email</dt><dd>{contactValue(email)}</dd>
          <dt>Phone</dt><dd>{contactValue(phone)}</dd>
          <dt>Website</dt><dd>{p.websiteUrl ? <span className="mono">{p.websiteUrl}</span> : none("Not added")}</dd>
          <dt>Social links</dt>
          <dd>
            {p.socialLinks.length === 0 ? none("Not added") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {p.socialLinks.map((l) => (
                  <div key={l.platform} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ color: "var(--ml-ink-muted)", minWidth: 74 }}>{platform(l.platform)}</span>
                    <a href={l.url} target="_blank" rel="noreferrer" className="mono" style={{ color: "var(--ml-accent)", wordBreak: "break-all" }}>{l.url}</a>
                  </div>
                ))}
              </div>
            )}
          </dd>
        </dl>
      </SheetRow>
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
  const rejected = verificationState(p) === "rejected";
  const emailState =
    p.hasLogin === false ? <Badge kind="pending">Invite not sent</Badge>
    : p.emailUnconfirmed ? <Badge kind="draft">{p.creationMethod === "super_admin" ? "Invite sent, password not set" : "Not confirmed"}</Badge>
    : <Badge kind="active">Confirmed</Badge>;

  return (
    <div className="card sheet">
      <SheetGroup icon={<ShieldCheck size={14} />} title="Account" />
      <Field label="Status"><Badge kind={p.status} /></Field>
      <Field label="Created via">{p.creationMethod === "super_admin" ? "Super Admin" : "Self sign-up"}</Field>
      <Field label="Date joined"><span className="tnum">{whenLabel(p.dateJoined)}</span></Field>
      <Field label="Last sign-in">{p.lastSignIn ? <span className="tnum">{whenLabel(p.lastSignIn)}</span> : none("Never signed in")}</Field>
      {p.status === "suspended" && <Field label="Suspended on">{p.suspendedOn ? <span className="tnum">{whenLabel(p.suspendedOn)}</span> : dash}</Field>}

      <SheetGroup icon={<Mail size={14} />} title="Sign-in" />
      <Field label="Email"><span className="mono">{p.email}</span></Field>
      <Field label="Email status">{emailState}</Field>

      <SheetGroup icon={<Shield size={14} />} title="Verification" />
      <Field label="Status">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <VerificationBadge p={p} />
          {p.verificationStatus === "pending" && <Link href={`/admin/pending/${p.slug}`} className="btn btn-sm">Open review</Link>}
        </span>
      </Field>
      {p.verificationStatus === "pending" && p.verificationSubmittedAt && <Field label="Submitted"><span className="tnum">{whenLabel(p.verificationSubmittedAt)}</span></Field>}
      {p.verificationStatus === "verified" && p.verifiedOn && <Field label="Verified on"><span className="tnum">{whenLabel(p.verifiedOn)}</span></Field>}
      {rejected && <Field label="Reason sent">{p.verificationNote}</Field>}

      <SheetGroup icon={<Globe size={14} />} title="Public page" />
      <Field label="Profile"><ProfileBadge p={p} /></Field>
      <Field label="Profile link">
        {slugEdit ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="subtle">{siteUrl.replace(/^https?:\/\//, "")}/</span>
            <input className="input input-plain" style={{ width: 220, height: 34 }} value={slug} onChange={(e) => setSlug(e.target.value)} />
            <button className="btn btn-sm btn-primary" disabled={pending} onClick={onSaveSlug}>Save</button>
            <button className="btn btn-sm" onClick={() => setSlugEdit(false)}>Cancel</button>
          </div>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {p.slugChosenAt ? <span style={{ color: "var(--ml-accent)" }}>{publicLink}</span> : <span className="subtle">Not chosen yet</span>}
            <button className="btn btn-sm" onClick={() => setSlugEdit(true)}><Pencil size={12} />{p.slugChosenAt ? "Edit" : "Set"}</button>
          </span>
        )}
      </Field>
    </div>
  );
}

function AppointmentsTab({
  appointments,
  stats,
  p,
}: {
  p: Practitioner;
  appointments: Appointment[];
  stats: { total: number; completed: number; cancelled: number };
}) {
  // Newest session first. The client is left out on purpose: who they are stays between them and the practitioner.
  const own = appointments
    .filter((a) => a.practitionerSlug === p.slug)
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="stat-tiles">
        {[
          { label: "Total appointments", value: stats.total },
          { label: "Completed", value: stats.completed },
          { label: "Cancelled", value: stats.cancelled },
        ].map((t) => (
          <div key={t.label} className="card kpi" style={{ gap: 10 }}>
            <div className="stat-label">{t.label}</div>
            <div className="tnum kpi-value">{t.value}</div>
          </div>
        ))}
      </div>

      {own.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "var(--ml-ink-subtle)", fontSize: 14 }}>No appointments yet.</div>
      ) : (
        <div style={{ boxShadow: "0 0 0 1px var(--ml-ring)", borderRadius: 12, overflow: "hidden" }}>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {own.map((b) => (
                  <tr key={b.id} style={{ cursor: "default" }}>
                    <td className="tnum">{b.date}</td>
                    <td className="tnum">{b.startTime}–{b.endTime}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ml-ink-muted)" }}>
                        {b.sessionType === "online" ? <Video size={14} /> : <MapPin size={14} />}
                        {b.sessionType === "online" ? "Online" : "On-Site"}
                      </span>
                    </td>
                    <td><Badge kind={b.status} /></td>
                    <td className="tnum" style={{ color: "var(--ml-ink-muted)" }}>{b.createdAt.slice(0, 16).replace("T", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ documents, personName }: { documents: PractitionerDocument[]; personName: string }) {
  return <DocumentList documents={documents} personName={personName} />;
}

type ActivityItem = { id: string; at: string; title: string; tone: "ok" | "danger" | "info"; actor?: string; note?: string };

const TONE_KIND = { ok: "active", danger: "suspended", info: "draft" } as const;

const whenLabel = (iso: string) => {
  const day = new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  // Stored times are UTC, so they say so rather than imply the viewer's clock.
  return iso.length > 10 ? `${day}, ${iso.slice(11, 16)} UTC` : day;
};

/** Everything that has happened to this account, newest first, as a plain log. */
function ActivityTab({ p, history, documents }: { p: Practitioner; history: ReviewEvent[]; documents: PractitionerDocument[] }) {
  const has = (kind: ReviewEvent["kind"]) => history.some((e) => e.kind === kind);

  // One entry per submission: older records logged one row per uploaded file, so rows in the same minute count once.
  const items: ActivityItem[] = [];
  const submittedAt = new Set<string>();
  for (const e of history) {
    const meta = REVIEW_EVENT_LABELS[e.kind];
    if (e.kind === "verification_submitted") {
      const minute = e.createdAt.slice(0, 16);
      if (submittedAt.has(minute)) continue;
      submittedAt.add(minute);
      items.push({ id: e.id, at: e.createdAt, title: meta.label, tone: meta.tone, actor: "Practitioner" });
      continue;
    }
    items.push({ id: e.id, at: e.createdAt, title: meta.label, tone: meta.tone, actor: e.actorName || undefined, note: e.note || undefined });
  }

  // Everything below comes from dates stored on the account itself, so older accounts with no logged decisions still read properly.
  items.push({
    id: "created",
    at: p.dateJoined,
    title: "Account created",
    tone: "info",
    actor: p.creationMethod === "super_admin" ? "Super Admin" : "Practitioner",
    note: p.creationMethod === "super_admin" ? "Added by Super Admin. Active from the start." : "Signed up themselves. Active from the start.",
  });
  if (p.emailConfirmedAt) {
    items.push({
      id: "email",
      at: p.emailConfirmedAt,
      title: p.creationMethod === "super_admin" ? "Password set" : "Email confirmed",
      tone: "ok",
      actor: "Practitioner",
      note: p.creationMethod === "super_admin" ? "Accepted the invite." : undefined,
    });
  }
  for (const d of documents) {
    items.push({ id: `doc-${d.id}`, at: d.uploadedAt, title: "Document uploaded", tone: "info", actor: "Practitioner", note: `${d.name} (${d.category})` });
  }
  if (p.verificationStatus === "pending" && p.verificationSubmittedAt && !has("verification_submitted")) {
    items.push({ id: "submitted", at: p.verificationSubmittedAt, title: "Verification submitted", tone: "info", actor: "Practitioner" });
  }
  if (p.lastSignIn) items.push({ id: "signin", at: p.lastSignIn, title: "Last sign-in", tone: "info", actor: "Practitioner" });
  if (p.status === "suspended" && p.suspendedOn && !has("account_suspended")) {
    items.push({ id: "suspended", at: p.suspendedOn, title: "Account suspended", tone: "danger", actor: "Super Admin" });
  }
  if (p.verifiedOn && !has("verification_approved")) {
    items.push({ id: "verified", at: p.verifiedOn, title: "Verification approved", tone: "ok", actor: "Super Admin" });
  }
  items.sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div style={{ boxShadow: "0 0 0 1px var(--ml-ring)", borderRadius: 12, overflow: "hidden" }}>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Event</th>
              <th>By</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} style={{ cursor: "default" }}>
                <td className="tnum" style={{ whiteSpace: "nowrap", color: "var(--ml-ink-muted)" }}>{whenLabel(it.at)}</td>
                <td><Badge kind={TONE_KIND[it.tone]}>{it.title}</Badge></td>
                <td>{it.actor ?? dash}</td>
                <td style={{ color: "var(--ml-ink-2)", maxWidth: 420 }}>{it.note ?? dash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
