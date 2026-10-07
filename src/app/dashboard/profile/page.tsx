import { ArrowUpRight, Eye, FileText, GraduationCap, Link2, Palette, User, Wallet } from "lucide-react";
import { getContactDetails, getCurrentPractitioner, isPubliclyVisible, suggestHandle } from "@/data/practitioners";
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
import { PublishProfileButton } from "@/components/portal/PublishProfileButton";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { currencyOptions } from "@/lib/currencies";
import { UnpublishProfileButton } from "@/components/portal/UnpublishProfileButton";
import { publishBlockReason } from "@/lib/verification";
import { ThemePicker } from "@/components/portal/ThemePicker";
import { LivePreviewToggle, LiveProfileEditor } from "@/components/portal/LiveProfileEditor";
import { BRAND_BACKGROUND, PLATFORM_ICON_PATH } from "@/components/practitioner/ContactLinks";
import { updateProfileAction } from "./actions";

export const metadata = { title: "Public profile" };

const iconClass = "size-4";

export default async function PublicProfilePage() {
  const practitioner = await getCurrentPractitioner();
  const contactDetails = getContactDetails(practitioner);
  const socials = Object.fromEntries(practitioner.socialLinks.map((link) => [link.platform, link.url]));

  const isLive = isPubliclyVisible(practitioner);
  // Why publishing isn't possible right now (null when it is). The server checks the same rule again on click.
  const blockedReason = publishBlockReason(practitioner);
  const adminOffline = practitioner.profileStatus === "hidden" || practitioner.profileStatus === "suspended";

  const sections: ProfileSection[] = [
    {
      id: "basics",
      label: "Basics",
      title: "Basics",
      icon: <User className={iconClass} aria-hidden />,
      content: (
        <>
          <SettingsRow
            label="Profile photo"
            htmlFor="profile-photo"
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
            label="Headline"
            htmlFor="shortBio"
          >
            <input
              id="shortBio"
              name="shortBio"
              maxLength={160}
              placeholder="e.g. Clinical psychologist working with adults and couples."
              defaultValue={practitioner.shortBio}
              className={settingsInputClass}
            />
          </SettingsRow>
          <SettingsRow
            label="Profile link"
            htmlFor="slug-editor"
            description="The link clients use to find and book you."
          >
            <SlugEditor slug={practitioner.slug} siteUrl={siteConfig.url} chosen={Boolean(practitioner.slugChosenAt)} live={isLive} suggestion={practitioner.slugChosenAt ? "" : await suggestHandle(practitioner.fullName)} />
          </SettingsRow>
        </>
      ),
    },
    {
      id: "about",
      label: "About you",
      title: "About you",
      icon: <FileText className={iconClass} aria-hidden />,
      content: (
        <>
          <SettingsRow label="Bio" htmlFor="bio">
            <textarea id="bio" name="bio" rows={7} defaultValue={practitioner.bio} className={settingsInputClass} />
          </SettingsRow>
          <SettingsRow label="Areas of expertise" htmlFor="specializations">
            <EditableList
              name="specializations"
              initialItems={practitioner.specializations}
              placeholder="Add an area of expertise"
              variant="list"
            />
          </SettingsRow>
          <SettingsRow label="Languages" htmlFor="languages">
            <EditableList
              name="languages"
              initialItems={practitioner.languages}
              placeholder="Add a language you see clients in"
              variant="list"
            />
          </SettingsRow>
          <SettingsRow label="Services offered" htmlFor="services">
            <EditableList
              name="services"
              initialItems={practitioner.services}
              placeholder="Add a service, e.g. Individual Therapy"
              variant="list"
            />
          </SettingsRow>
        </>
      ),
    },
    {
      id: "credentials",
      label: "Education & experience",
      title: "Education & experience",
      icon: <GraduationCap className={iconClass} aria-hidden />,
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
          <SettingsRow label="Education" htmlFor="education">
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
          <SettingsRow label="Experience" htmlFor="workExperience">
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
      icon: <Wallet className={iconClass} aria-hidden />,
      content: (
        <>
          <SessionModeFields
            initialMode={practitioner.sessionType}
            initialLocation={practitioner.location ?? ""}
          />
          <SettingsRow
            label="Fee range"
            htmlFor="feeCurrency"
          >
            <div className="grid grid-cols-3 gap-3">
              <ThemedSelect
                id="feeCurrency"
                name="feeCurrency"
                ariaLabel="Currency"
                defaultValue={practitioner.feeRange.currency}
                options={currencyOptions(practitioner.feeRange.currency)}
                triggerClassName={`${settingsInputClass} flex w-full items-center text-left`}
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
      icon: <Link2 className={iconClass} aria-hidden />,
      content: (
        <>
          <SettingsRow
            label="Contact details"
            htmlFor="contact-email"
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
          <SettingsRow label="Social links" htmlFor="social_instagram">
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
                    className="min-w-0 flex-1 rounded-lg bg-surface px-3 py-2 text-sm ring-1 ring-black/[0.06] transition outline-none focus:ring-primary/40"
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
      icon: <Palette className={iconClass} aria-hidden />,
      content: (
        <SettingsRow label="Color theme" htmlFor="colorTheme">
          <ThemePicker selected={practitioner.colorTheme ?? DEFAULT_COLOR_THEME} />
        </SettingsRow>
      ),
    },
  ];

  const liveButtonClass =
    "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition";

  return (
    <LiveProfileEditor practitioner={practitioner} formId="profile-form">
    <div className="mx-auto w-full max-w-6xl space-y-8 px-2 pb-12 sm:px-4">
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
        description="Manage the details shown on your public profile."
        actions={
          <div className="flex flex-wrap items-start justify-end gap-2.5">
            <LivePreviewToggle />
            {/* Only while the profile isn't live: once it is, saving updates it straight away, so the live page is the preview. */}
            {!isLive && (
              <a
                href={`/preview/${practitioner.slug}`}
                target="_blank"
                rel="noopener"
                title="Only you can see this. It's a private preview, and nobody can book from it."
                className={`${liveButtonClass} ring-1 ring-black/[0.14] hover:bg-black/[0.04]`}
              >
                <Eye className="size-4" aria-hidden />
                Preview profile
              </a>
            )}

            {isLive ? (
              <>
                <UnpublishProfileButton slug={practitioner.slug} />
                <a
                  href={`/${practitioner.slug}`}
                  target="_blank"
                  rel="noopener"
                  className={`${liveButtonClass} bg-primary text-primary-foreground hover:opacity-90`}
                >
                  View live profile
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              </>
            ) : (
              <PublishProfileButton
                slug={practitioner.slug}
                blockedReason={blockedReason}
                fixHref={blockedReason && !adminOffline && practitioner.status === "active" ? "/dashboard/verification" : undefined}
              />
            )}
          </div>
        }
      />

      <form id="profile-form" action={updateProfileAction}>
        <input type="hidden" name="slug" value={practitioner.slug} />

        <ProfileSections sections={sections} />

        <div className="sticky bottom-4 z-10 mt-8 flex items-center justify-between gap-4 rounded-2xl bg-surface/90 px-5 py-3.5 shadow-lg ring-1 ring-black/[0.08] backdrop-blur">
          <button
            type="submit"
            className="ml-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
    </LiveProfileEditor>
  );
}
