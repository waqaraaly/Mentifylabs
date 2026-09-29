import { ArrowUpRight, FileText, GraduationCap, Link2, Palette, User, Wallet } from "lucide-react";
import { getContactDetails, getCurrentPractitioner, isPubliclyVisible } from "@/data/practitioners";
import { hasFeeRange } from "@/lib/fees";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import { siteConfig } from "@/lib/site";
import { DEFAULT_COLOR_THEME } from "@/lib/themes";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfilePhotoUploader } from "@/components/portal/ProfilePhotoUploader";
import { EditableList } from "@/components/portal/EditableList";
import { EntryListEditor } from "@/components/portal/EntryListEditor";
import { ContactDetailsEditor } from "@/components/portal/ContactDetailsEditor";
import { ProfileSections, type ProfileSection } from "@/components/portal/ProfileSections";
import { SessionModeFields } from "@/components/portal/SessionModeFields";
import { SettingsRow, settingsInputClass } from "@/components/portal/SettingsRow";
import { SlugEditor } from "@/components/portal/SlugEditor";
import { ThemePicker } from "@/components/portal/ThemePicker";
import { BRAND_BACKGROUND, PLATFORM_ICON_PATH } from "@/components/practitioner/ContactLinks";
import { updateProfileAction } from "./actions";

export const metadata = { title: "Public Profile" };

const iconClass = "size-4";

const NOT_LIVE_REASON: Record<string, string> = {
  draft: "Your profile is still a draft.",
  in_review: "Your profile is waiting for admin approval.",
  incomplete: "Your profile needs changes before it can go live.",
  hidden: "Your profile is hidden by an admin.",
  suspended: "Your account is suspended.",
};

export default async function PublicProfilePage() {
  const practitioner = await getCurrentPractitioner();
  const contactDetails = getContactDetails(practitioner);
  const socials = Object.fromEntries(practitioner.socialLinks.map((link) => [link.platform, link.url]));

  const isLive = isPubliclyVisible(practitioner);
  const notLiveReason = NOT_LIVE_REASON[practitioner.profileStatus] ?? "Your profile isn't published yet.";

  const sections: ProfileSection[] = [
    {
      id: "basics",
      label: "Basics",
      title: "Basics",
      description: "Your name, title and the link you share with clients.",
      icon: <User className={iconClass} aria-hidden />,
      done: Boolean(practitioner.fullName && practitioner.professionalTitle && practitioner.shortBio),
      content: (
        <>
          <SettingsRow
            label="Profile photo"
            htmlFor="profile-photo"
            description="Shown at the top of your public profile. A clear, well-lit headshot works best."
          >
            <ProfilePhotoUploader
              slug={practitioner.slug}
              fullName={practitioner.fullName}
              photoUrl={practitioner.photoUrl}
            />
          </SettingsRow>
          <SettingsRow
            label="Full name"
            htmlFor="fullName"
            description="The name clients see on your public profile. Separate from your account name in Settings."
          >
            <input
              id="fullName"
              name="fullName"
              defaultValue={practitioner.fullName}
              required
              className={settingsInputClass}
            />
          </SettingsRow>
          <SettingsRow label="Professional title" htmlFor="professionalTitle">
            <input
              id="professionalTitle"
              name="professionalTitle"
              defaultValue={practitioner.professionalTitle}
              required
              className={settingsInputClass}
            />
          </SettingsRow>
          <SettingsRow
            label="Bio"
            htmlFor="shortBio"
            description="A one-line summary shown right under your name."
          >
            <input
              id="shortBio"
              name="shortBio"
              maxLength={160}
              placeholder="e.g. Helping adults manage anxiety and burnout."
              defaultValue={practitioner.shortBio}
              className={settingsInputClass}
            />
          </SettingsRow>
          <SettingsRow
            label="Public URL"
            htmlFor="slug-editor"
            description="The web address of your professional profile. Share it with clients to let them find and book you."
          >
            <SlugEditor slug={practitioner.slug} siteUrl={siteConfig.url} />
          </SettingsRow>
        </>
      ),
    },
    {
      id: "about",
      label: "About you",
      title: "About you",
      description: "Your introduction and what you help clients with.",
      icon: <FileText className={iconClass} aria-hidden />,
      done: practitioner.bio.trim().length >= 80 && practitioner.specializations.length > 0,
      content: (
        <>
          <SettingsRow label="About you" htmlFor="bio" description="A few sentences on who you are and how you work.">
            <textarea id="bio" name="bio" rows={7} defaultValue={practitioner.bio} className={settingsInputClass} />
          </SettingsRow>
          <SettingsRow label="Areas of expertise" htmlFor="specializations" description="What you help clients with.">
            <EditableList
              name="specializations"
              initialItems={practitioner.specializations}
              placeholder="Add an area of expertise…"
              variant="tags"
            />
          </SettingsRow>
          <SettingsRow label="Services offered" htmlFor="services" description="The types of sessions you provide.">
            <EditableList
              name="services"
              initialItems={practitioner.services}
              placeholder="Add a service, e.g. Individual Therapy…"
              variant="list"
            />
          </SettingsRow>
          <SettingsRow
            label="Note for future clients"
            htmlFor="noteForClients"
            description="A short personal message shown in a highlighted section at the end of your public profile — optional."
          >
            <textarea
              id="noteForClients"
              name="noteForClients"
              rows={4}
              maxLength={400}
              placeholder="e.g. Reaching out is the hardest step — I'm glad you're here…"
              defaultValue={practitioner.noteForClients}
              className={settingsInputClass}
            />
          </SettingsRow>
        </>
      ),
    },
    {
      id: "credentials",
      label: "Education & work",
      title: "Education & Experience",
      description: "The background that builds a client's trust.",
      icon: <GraduationCap className={iconClass} aria-hidden />,
      done: practitioner.education.length > 0,
      content: (
        <>
          <SettingsRow label="Years of experience" htmlFor="experienceYears">
            <div className="flex items-center gap-2.5">
              <input
                id="experienceYears"
                name="experienceYears"
                type="number"
                min={0}
                defaultValue={practitioner.experienceYears}
                className={`${settingsInputClass} max-w-[110px]`}
              />
              <span className="text-sm text-muted">years</span>
            </div>
          </SettingsRow>
          <SettingsRow label="Education" htmlFor="education" description="Your degrees and programs, with the institute and years.">
            <EntryListEditor
              name="education"
              initialItems={practitioner.education}
              titleLabel="Degree or program"
              placeLabel="Institute"
              titlePlaceholder="e.g. M.Phil Clinical Psychology"
              placePlaceholder="e.g. University of the Punjab"
              addLabel="Add education"
            />
          </SettingsRow>
          <SettingsRow label="Experience" htmlFor="workExperience" description="Roles you've held, with the organization and years.">
            <EntryListEditor
              name="workExperience"
              initialItems={practitioner.workExperience ?? []}
              titleLabel="Role"
              placeLabel="Organization"
              titlePlaceholder="e.g. Clinical Psychologist"
              placePlaceholder="e.g. Fountain House"
              addLabel="Add experience"
            />
          </SettingsRow>
        </>
      ),
    },
    {
      id: "session",
      label: "Sessions & fees",
      title: "Sessions & fees",
      description: "How and where you see clients, and what you charge.",
      icon: <Wallet className={iconClass} aria-hidden />,
      done: hasFeeRange(practitioner.feeRange),
      content: (
        <>
          <SessionModeFields
            initialMode={practitioner.sessionType}
            initialLocation={practitioner.location ?? ""}
          />
          <SettingsRow
            label="Fee range"
            htmlFor="feeCurrency"
            description="Your general fee range, shown to clients before they book. It applies to every session type."
          >
            <div className="grid grid-cols-3 gap-3">
              <input
                id="feeCurrency"
                name="feeCurrency"
                placeholder="Currency"
                aria-label="Currency"
                defaultValue={practitioner.feeRange.currency}
                className={settingsInputClass}
              />
              <input
                id="feeMin"
                name="feeMin"
                type="number"
                min={0}
                placeholder="Min"
                aria-label="Minimum fee"
                defaultValue={practitioner.feeRange.min || ""}
                className={settingsInputClass}
              />
              <input
                id="feeMax"
                name="feeMax"
                type="number"
                min={0}
                placeholder="Max"
                aria-label="Maximum fee"
                defaultValue={practitioner.feeRange.max || ""}
                className={settingsInputClass}
              />
            </div>
          </SettingsRow>
        </>
      ),
    },
    {
      id: "links",
      label: "Contact & links",
      title: "Contact & links",
      description: "Where clients can reach or follow you.",
      icon: <Link2 className={iconClass} aria-hidden />,
      done: contactDetails.some((c) => c.isPublic && c.value) || practitioner.socialLinks.length > 0,
      content: (
        <>
          <SettingsRow
            label="Contact details"
            htmlFor="contact-email"
            description="The contact details clients see. They're separate from the email and phone on your account in Settings. Toggle each one public, or keep it private."
          >
            <ContactDetailsEditor initialItems={contactDetails} />
          </SettingsRow>
          <SettingsRow label="Website" htmlFor="websiteUrl">
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://…"
              defaultValue={practitioner.websiteUrl}
              className={settingsInputClass}
            />
          </SettingsRow>
          <SettingsRow label="Social links" htmlFor="social_instagram" description="Add any that are public.">
            <div className="space-y-2.5">
              {SOCIAL_PLATFORMS.map(({ platform, name }) => (
                <div
                  key={platform}
                  className="flex flex-wrap items-center gap-2.5 rounded-xl bg-black/[0.025] p-2.5"
                >
                  <label
                    htmlFor={`social_${platform}`}
                    className="flex w-full items-center gap-2 text-sm font-medium sm:w-28"
                  >
                    <span
                      className="flex size-5 shrink-0 items-center justify-center rounded-md text-white"
                      style={{ background: BRAND_BACKGROUND[platform] }}
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
                        <path d={PLATFORM_ICON_PATH[platform]} />
                      </svg>
                    </span>
                    {name}
                  </label>
                  <input
                    id={`social_${platform}`}
                    name={`social_${platform}`}
                    type="url"
                    placeholder={`https://${platform}.com/…`}
                    defaultValue={socials[platform] ?? ""}
                    className="min-w-[10rem] flex-1 rounded-lg bg-surface px-3 py-2 text-sm ring-1 ring-black/[0.06] transition outline-none focus:ring-primary/40"
                  />
                </div>
              ))}
            </div>
          </SettingsRow>
        </>
      ),
    },
    {
      id: "theme",
      label: "Appearance",
      title: "Appearance",
      description: "The color palette clients see on your public profile.",
      icon: <Palette className={iconClass} aria-hidden />,
      done: true,
      content: (
        <SettingsRow label="Color theme" htmlFor="colorTheme" description="Pick the palette your profile is shown in.">
          <ThemePicker selected={practitioner.colorTheme ?? DEFAULT_COLOR_THEME} />
        </SettingsRow>
      ),
    },
  ];

  const liveButtonClass =
    "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-1 pb-8 sm:px-3">
      <PageHeader
        icon={User}
        title="Public profile"
        badge={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-normal ${
              isLive ? "bg-primary/[0.1] text-primary" : "bg-black/[0.05] text-muted"
            }`}
          >
            <span className={`size-1.5 rounded-full ${isLive ? "bg-primary" : "bg-black/30"}`} aria-hidden />
            {isLive ? "Live" : "Not live"}
          </span>
        }
        description={isLive ? "What clients see when they find you. Changes appear as soon as you save." : notLiveReason}
        actions={
          isLive ? (
            <a
              href={`/${practitioner.slug}`}
              target="_blank"
              rel="noopener"
              className={`${liveButtonClass} bg-primary text-primary-foreground hover:opacity-90`}
            >
              View live profile
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          ) : (
            <span
              title="Available once your profile is published"
              className={`${liveButtonClass} cursor-not-allowed bg-black/[0.05] text-muted`}
            >
              View live profile
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          )
        }
      />

      <form action={updateProfileAction}>
        <input type="hidden" name="slug" value={practitioner.slug} />

        <ProfileSections sections={sections} />

        <div className="sticky bottom-4 z-10 mt-8 flex items-center justify-between gap-4 rounded-2xl bg-surface/90 px-5 py-3.5 shadow-lg ring-1 ring-black/[0.08] backdrop-blur">
          <p className="hidden text-sm text-muted sm:block">
            Changes appear on your live profile as soon as you save.
          </p>
          <button
            type="submit"
            className="ml-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
