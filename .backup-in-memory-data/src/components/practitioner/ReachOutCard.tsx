import { Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ComponentType } from "react";
import type { Practitioner } from "@/types/practitioner";
import { BRAND_BACKGROUND, PLATFORM_ICON_PATH } from "@/components/practitioner/ContactLinks";

function Row({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-(--pt-icon-border) bg-(--pt-icon-fill) text-(--pt-accent-light)">
        <Icon className="size-[17px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] tracking-[0.08em] text-(--pt-muted-light) uppercase">{label}</p>
        <p className="mt-0.5 text-[15px] leading-snug font-medium text-(--pt-dark-card-foreground)">{value}</p>
      </div>
    </>
  );

  const className = "flex items-center gap-4 border-t border-(--pt-dark-divider) py-4 transition";

  return href ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

const CONTACT_ICON: Record<string, ComponentType<{ className?: string }>> = { Email: Mail, Phone };

function contactHref(value: string): string | undefined {
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^\+?[\d\s()-]{7,}$/.test(value)) return `tel:${value.replace(/[^\d+]/g, "")}`;
  return undefined;
}

// A self-contained contact card — email/phone/mode/location plus
// real brand-colored social links — matching the reference design's
// "Reach out" panel exactly, and replacing the separate Contact/Session
// Format/Languages sections it doesn't have. Filled-dark vs.
// transparent-outlined is entirely theme-driven (see the --pt-dark-card*
// and --pt-icon-* tokens in globals.css), not branched here.
export function ReachOutCard({ practitioner }: { practitioner: Practitioner }) {
  // The portal's single "Location" field, which only exists for on-site work —
  // so an online-only profile never shows one.
  const location = practitioner.sessionType === "online" ? undefined : practitioner.location;
  // Contact details the practitioner marked Private must never reach the public page.
  const publicContacts = practitioner.contactMethods.filter((c) => c.isPublic && c.value);
  const hasLinks = practitioner.socialLinks.length > 0 || practitioner.websiteUrl;

  return (
    <div className="rounded-[28px] border-[1.5px] border-(--pt-dark-card-border) bg-(--pt-dark-card) p-7 shadow-[0_20px_45px_-20px_var(--pt-dark-card-shadow)] sm:p-9">
      <h3 className="text-[19px] font-semibold text-(--pt-dark-card-foreground)">Reach out</h3>

      <div>
        {publicContacts.map((c) => (
          <Row
            key={c.label}
            icon={CONTACT_ICON[c.label] ?? MessageCircle}
            label={c.label}
            value={c.value}
            href={contactHref(c.value)}
          />
        ))}
        {location && <Row icon={MapPin} label="Location" value={location} />}
      </div>

      {hasLinks && (
        <div className="mt-1.5 flex flex-wrap justify-center gap-2.5 border-t border-(--pt-dark-divider) pt-6">
          {practitioner.socialLinks.map((link) => {
            const brandBackground = BRAND_BACKGROUND[link.platform];
            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.platform}
                className="flex size-[38px] items-center justify-center rounded-lg text-white shadow-sm transition hover:-translate-y-0.5"
                style={{ background: brandBackground ?? "rgba(255,255,255,0.15)" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
                  <path d={PLATFORM_ICON_PATH[link.platform]} />
                </svg>
              </a>
            );
          })}
          {practitioner.websiteUrl && (
            <a
              href={practitioner.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Website"
              className="flex size-[38px] items-center justify-center rounded-lg border border-(--pt-icon-border) bg-(--pt-icon-fill) text-(--pt-accent-light) transition hover:-translate-y-0.5"
            >
              <Globe className="size-[17px]" aria-hidden />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
