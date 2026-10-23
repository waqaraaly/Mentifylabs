import type { CSSProperties, ComponentType, ReactNode } from "react";
import { Banknote, Briefcase, Check, Globe, Languages, Mail, MapPin, MessageCircle, Monitor, Phone, ShieldCheck } from "lucide-react";
import { VerifiedBadge, VerifiedTooltip } from "@/components/practitioner/ProfileHero";
import { BRAND_BACKGROUND, PLATFORM_ICON_PATH } from "@/components/practitioner/ContactLinks";
import type { ExpertiseStyle, JourneyStyle, PhotoShape, ServicesStyle } from "@/lib/templates";
import type { Entry, ProfileModel } from "@/components/practitioner/templates/model";

/** Sets how far into the page's entrance sequence an element appears. */
export const rise = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

// ---- Portrait ----

// Profile photos are saved as squares, so the shapes are crops of a square: a clear face, never a gimmick.
export const SHAPE_STYLE: Record<PhotoShape, { aspect: string; radius: string }> = {
  circle: { aspect: "1 / 1", radius: "9999px" },
  rounded: { aspect: "1 / 1", radius: "22%" },
  oval: { aspect: "4 / 5", radius: "50%" },
  square: { aspect: "1 / 1", radius: "6px" },
  blob: { aspect: "4 / 5", radius: "60% 40% 30% 70% / 55% 45% 65% 35%" },
};

/** The practitioner's photo in the template's shape, or their initials when there is no photo. */
export function Portrait({ m, shape, className = "", style }: { m: ProfileModel; shape: PhotoShape; className?: string; style?: CSSProperties }) {
  const { aspect, radius } = SHAPE_STYLE[shape];
  const { photoUrl, fullName } = m.practitioner;
  return (
    <div className={`relative shrink-0 overflow-hidden bg-(--pt-tint-strong) ${className}`} style={{ aspectRatio: aspect, borderRadius: radius, ...style }}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={`Portrait of ${fullName}`} className="size-full object-cover" />
      ) : (
        <div role="img" aria-label={`${fullName}'s portrait`} className="pt-display flex size-full items-center justify-center text-[clamp(2rem,6vw,3.6rem)] text-(--pt-accent-text)">
          {m.initials}
        </div>
      )}
    </div>
  );
}

// ---- Name and trust ----

export function Verified({ className = "size-[0.5em]" }: { className?: string }) {
  return (
    <VerifiedTooltip label="Verified practitioner">
      <VerifiedBadge className={`${className} shrink-0`} />
    </VerifiedTooltip>
  );
}

/** The name as the page's main heading, with the verified tick beside it. */
export function Name({
  m,
  size = "pt-h1",
  tick = "text-[0.5em]",
  className = "",
}: {
  m: ProfileModel;
  size?: string;
  /** The tick is one em of this text size, as a fraction of the name's size. */
  tick?: string;
  className?: string;
}) {
  return (
    <h1 className={`pt-display ${size} [overflow-wrap:anywhere] ${className}`}>
      {m.practitioner.fullName}
      {m.verified && (
        <span className={`ml-[0.28em] inline-flex align-middle ${tick}`}>
          <Verified className="size-[1em]" />
        </span>
      )}
    </h1>
  );
}

/** Title and the main qualification, the line that sits right under the name on a health profile. */
export function Credentials({ m, className = "" }: { m: ProfileModel; className?: string }) {
  return (
    <p className={`text-[1.0625rem] leading-snug [overflow-wrap:anywhere] ${className}`}>
      <span className="font-semibold">{m.title}</span>
      {m.qualification && <span className="text-(--pt-muted)"> · {m.qualification}</span>}
    </p>
  );
}

const PILL = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] leading-none font-medium";

/** The trust signals a client scans for, in one row: verified, taking clients, experience, how they meet, fee. */
export function Badges({ m, show = ["verified", "accepting", "years", "formats", "fee"], className = "" }: { m: ProfileModel; show?: string[]; className?: string }) {
  const years = m.stats.find((s) => s.label === "Experience");
  const pill = `${PILL} bg-(--pt-tint) text-(--pt-text) shadow-[inset_0_0_0_1px_var(--pt-border)]`;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {show.includes("verified") && m.verified && (
        <li className={pill}>
          <ShieldCheck className="size-3.5 text-(--pt-accent-text)" aria-hidden />
          Verified
        </li>
      )}
      {show.includes("accepting") && (
        <li className={pill}>
          <span aria-hidden className={`size-2 rounded-full ${m.accepting ? "bg-(--pt-ok)" : "bg-(--pt-muted)"}`} />
          {m.accepting ? "Taking new clients" : "Not taking new clients"}
        </li>
      )}
      {show.includes("years") && years && (
        <li className={pill}>
          <Briefcase className="size-3.5 text-(--pt-accent-text)" aria-hidden />
          {years.value}
        </li>
      )}
      {show.includes("formats") && m.formats.length > 0 && (
        <li className={pill}>
          <Monitor className="size-3.5 text-(--pt-accent-text)" aria-hidden />
          {m.formats.join(" and ")}
        </li>
      )}
      {show.includes("fee") && m.fee && (
        <li className={pill}>
          <Banknote className="size-3.5 text-(--pt-accent-text)" aria-hidden />
          {m.fee}
        </li>
      )}
    </ul>
  );
}

/** Quick facts as labelled icon rows: the "Basic information" block. */
export function FactList({ m, className = "" }: { m: ProfileModel; className?: string }) {
  const years = m.stats.find((s) => s.label === "Experience");
  const rows: { icon: ComponentType<{ className?: string }>; label: string; value: string }[] = [];
  if (m.location) rows.push({ icon: MapPin, label: "Location", value: m.location });
  if (m.formats.length) rows.push({ icon: Monitor, label: "Sessions", value: m.formats.join(" and ") });
  if (m.languages.length) rows.push({ icon: Languages, label: "Languages", value: m.languages.join(", ") });
  if (m.fee) rows.push({ icon: Banknote, label: "Fee", value: m.fee });
  if (years) rows.push({ icon: Briefcase, label: "Experience", value: years.value });
  return (
    <ul className={`space-y-4 ${className}`}>
      {rows.map(({ icon: Icon, label, value }) => (
        <li key={label} className="flex items-start gap-3.5">
          <Icon className="mt-0.5 size-[1.15rem] shrink-0 text-(--pt-accent-text)" aria-hidden />
          <span className="min-w-0 leading-snug">
            <span className="pt-label block text-[0.7rem] text-(--pt-muted)">{label}</span>
            <span className="block text-[0.98rem] font-medium [overflow-wrap:anywhere]">{value}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---- Sections ----

export type SectionId = "about" | "expertise" | "services" | "journey" | "contact";

export const SECTION_COPY: Record<SectionId, string> = {
  about: "About me",
  expertise: "Areas of expertise",
  services: "Services",
  journey: "Qualifications and experience",
  contact: "Contact",
};

export function SectionTitle({ id, title, className = "" }: { id: SectionId; title?: string; className?: string }) {
  return <h2 className={`pt-display pt-h2 mb-5 ${className}`}>{title ?? SECTION_COPY[id]}</h2>;
}

export function About({ m, className = "" }: { m: ProfileModel; className?: string }) {
  if (m.paragraphs.length === 0) return null;
  return (
    <div className={`space-y-4 text-[1.0625rem] leading-[1.75] [overflow-wrap:anywhere] ${className}`}>
      {m.paragraphs.map((paragraph, i) => (
        <p key={i} className="max-w-[68ch] whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function Expertise({ items, variant }: { items: string[]; variant: ExpertiseStyle }) {
  if (items.length === 0) return null;
  return (
    <div className="@container">
      <ExpertiseList items={items} variant={variant} />
    </div>
  );
}

function ExpertiseList({ items, variant }: { items: string[]; variant: ExpertiseStyle }) {
  if (variant === "bullets" || variant === "checks") {
    return (
      <ul className="grid gap-x-10 gap-y-2.5 @md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-[1.0625rem] leading-snug">
            {variant === "checks" ? (
              <Check className="mt-[0.2em] size-[1.05em] shrink-0 text-(--pt-accent-text)" strokeWidth={2.5} aria-hidden />
            ) : (
              <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-(--pt-accent)" />
            )}
            <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "tiles") {
    return (
      <ul className="grid gap-3 @sm:grid-cols-2 @3xl:grid-cols-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 rounded-(--pt-r) bg-(--pt-surface) px-4 py-3.5 text-[0.98rem] font-medium shadow-[inset_0_0_0_1px_var(--pt-border)]">
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-(--pt-accent)" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "cloud") {
    return (
      <p className="pt-display text-[calc(clamp(1.35rem,2.6vw,1.8rem)*var(--pt-ds))] leading-[1.4]">
        {items.map((item, i) => (
          <span key={item}>
            {item}
            {i < items.length - 1 && (
              <span aria-hidden className="mx-[0.5em] text-(--pt-accent-text)">
                ·
              </span>
            )}
          </span>
        ))}
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2.5">
      {items.map((item) => (
        <li key={item} className="rounded-lg bg-(--pt-tint) px-4 py-2 text-[0.95rem] font-medium shadow-[inset_0_0_0_1px_var(--pt-border)] [overflow-wrap:anywhere]">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Services({ items, variant }: { items: string[]; variant: ServicesStyle }) {
  if (items.length === 0) return null;
  return (
    <div className="@container">
      <ServicesList items={items} variant={variant} />
    </div>
  );
}

function ServicesList({ items, variant }: { items: string[]; variant: ServicesStyle }) {
  if (variant === "cards") {
    return (
      <ul className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-3">
        {items.map((item) => (
          <li key={item} className="flex gap-4 rounded-(--pt-r) bg-(--pt-surface) p-5 shadow-[inset_0_0_0_1px_var(--pt-border)]">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--pt-tint-strong) text-(--pt-accent-text)">
              <Check className="size-5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="pt-display pt-h3 min-w-0 self-center [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "rows") {
    return (
      <ul className="border-t border-(--pt-border)">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-4 border-b border-(--pt-border) py-4 text-[1.1rem] font-medium">
            <Check className="size-[1.1em] shrink-0 text-(--pt-accent-text)" strokeWidth={2.5} aria-hidden />
            <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid gap-x-10 gap-y-3 @md:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[1.0625rem] leading-snug">
          {variant === "checks" ? (
            <Check className="mt-[0.2em] size-[1.05em] shrink-0 text-(--pt-accent-text)" strokeWidth={2.5} aria-hidden />
          ) : (
            <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-(--pt-accent)" />
          )}
          <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function JourneyGroup({ label, entries, variant }: { label: string; entries: Entry[]; variant: JourneyStyle }) {
  return (
    <div>
      <h3 className="pt-label mb-4 text-(--pt-muted)">{label}</h3>

      {variant === "rail" && (
        <ol className="ml-1.5 space-y-6 border-l border-(--pt-border) pl-7">
          {entries.map((e, i) => (
            <li key={`${e.title}-${i}`} className="relative">
              <span aria-hidden className="absolute top-[0.45rem] -left-[calc(1.75rem+3.5px)] size-[7px] rounded-full bg-(--pt-accent) ring-[5px] ring-(--pt-bg)" />
              {e.years && <p className="pt-label text-(--pt-accent-text)">{e.years}</p>}
              <p className="mt-1 text-[1.05rem] leading-snug font-semibold [overflow-wrap:anywhere]">{e.title}</p>
              {e.place && <p className="mt-0.5 text-(--pt-muted) [overflow-wrap:anywhere]">{e.place}</p>}
            </li>
          ))}
        </ol>
      )}

      {variant === "rows" && (
        <ol className="border-t border-(--pt-border)">
          {entries.map((e, i) => (
            <li key={`${e.title}-${i}`} className="grid gap-0.5 border-b border-(--pt-border) py-3.5 sm:grid-cols-[8.5rem_1fr] sm:gap-5">
              <span className="text-sm font-medium text-(--pt-muted)">{e.years || " "}</span>
              <span>
                <span className="block text-[1.05rem] font-semibold [overflow-wrap:anywhere]">{e.title}</span>
                {e.place && <span className="block text-(--pt-muted) [overflow-wrap:anywhere]">{e.place}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}

      {variant === "cards" && (
        <ol className="grid gap-3">
          {entries.map((e, i) => (
            <li key={`${e.title}-${i}`} className="rounded-(--pt-r) bg-(--pt-surface) p-5 shadow-[inset_0_0_0_1px_var(--pt-border)]">
              {e.years && <span className="inline-block rounded-full bg-(--pt-tint) px-3 py-1 text-xs font-semibold">{e.years}</span>}
              <p className="mt-2.5 text-[1.05rem] leading-snug font-semibold [overflow-wrap:anywhere]">{e.title}</p>
              {e.place && <p className="mt-0.5 text-(--pt-muted) [overflow-wrap:anywhere]">{e.place}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function Journey({ m, variant }: { m: ProfileModel; variant: JourneyStyle }) {
  const groups = [
    { label: "Experience", entries: m.experience },
    { label: "Education", entries: m.education },
  ].filter((g) => g.entries.length > 0);
  if (groups.length === 0) return null;
  const sideBySide = groups.length > 1 && variant !== "rows";

  return (
    <div className={sideBySide ? "grid gap-10 md:grid-cols-2" : "space-y-10"}>
      {groups.map((g) => (
        <JourneyGroup key={g.label} {...g} variant={variant} />
      ))}
    </div>
  );
}

// ---- Contact ----

const CONTACT_ICON: Record<string, ComponentType<{ className?: string }>> = { Email: Mail, Phone };

/** Public contact details as icon rows, then social links. Nothing is drawn when there is nothing to show. */
export function ContactList({ m, className = "", socials = true }: { m: ProfileModel; className?: string; socials?: boolean }) {
  if (!m.hasContact) return null;
  const hasLinks = socials && (m.socials.length > 0 || m.website);
  return (
    <div className={className}>
      <ul className="space-y-3.5">
        {m.contacts.map((c) => {
          const Icon = CONTACT_ICON[c.label] ?? MessageCircle;
          const inner = (
            <>
              <Icon className="mt-0.5 size-[1.15rem] shrink-0 text-(--pt-accent-text)" aria-hidden />
              <span className="min-w-0 leading-snug">
                <span className="pt-label block text-[0.7rem] text-(--pt-muted)">{c.label}</span>
                <span className="block text-[0.98rem] font-medium [overflow-wrap:anywhere]">{c.value}</span>
              </span>
            </>
          );
          return (
            <li key={c.label}>
              {c.href ? (
                <a href={c.href} className="flex items-start gap-3.5 transition hover:opacity-75">
                  {inner}
                </a>
              ) : (
                <div className="flex items-start gap-3.5">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      {hasLinks && (
        <div className={`flex flex-wrap gap-2 ${m.contacts.length ? "mt-5" : ""}`}>
          {m.socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.platform}
              className="flex size-10 items-center justify-center rounded-full text-white transition hover:-translate-y-0.5"
              style={{ background: BRAND_BACKGROUND[s.platform] ?? "var(--pt-text)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
                <path d={PLATFORM_ICON_PATH[s.platform]} />
              </svg>
            </a>
          ))}
          {m.website && (
            <a href={m.website} target="_blank" rel="noopener noreferrer" aria-label="Website" className="flex size-10 items-center justify-center rounded-full text-(--pt-accent-text) shadow-[inset_0_0_0_1.5px_currentColor] transition hover:-translate-y-0.5">
              <Globe className="size-[1.05rem]" aria-hidden />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** Email and phone as big outlined buttons, when the practitioner shared them. */
export function ContactButtons({ m, className = "" }: { m: ProfileModel; className?: string }) {
  const email = m.contacts.find((c) => c.href?.startsWith("mailto:"));
  const phone = m.contacts.find((c) => c.href?.startsWith("tel:"));
  if (!email && !phone) return null;
  const cls =
    "inline-flex items-center justify-center gap-2 rounded-(--pt-btn,0.6rem) px-5 py-3 text-sm font-semibold text-(--pt-accent-text) shadow-[inset_0_0_0_1.5px_var(--pt-accent)] transition hover:bg-(--pt-accent) hover:text-(--pt-accent-foreground)";
  return (
    <div className={`grid gap-2.5 ${className}`}>
      {email && (
        <a href={email.href} className={cls}>
          <Mail className="size-4" aria-hidden />
          Send an email
        </a>
      )}
      {phone && (
        <a href={phone.href} className={cls}>
          <Phone className="size-4" aria-hidden />
          {phone.value}
        </a>
      )}
    </div>
  );
}

/** How booking works here: three steps that describe our own booking flow. */
export function HowBooking({ className = "" }: { className?: string }) {
  const steps = [
    ["Choose a time", "Pick one of the open times, online or on-site."],
    ["Send your request", "Share your name and a way to reach you."],
    ["They confirm", "Your practitioner confirms the session with you."],
  ];
  return (
    <ol className={`grid gap-5 sm:grid-cols-3 ${className}`}>
      {steps.map(([title, body], i) => (
        <li key={title} className="flex gap-4">
          <span className="pt-display flex size-9 shrink-0 items-center justify-center rounded-full bg-(--pt-tint-strong) text-[1rem] text-(--pt-accent-text)">{i + 1}</span>
          <span>
            <span className="block font-semibold">{title}</span>
            <span className="mt-1 block text-[0.95rem] leading-snug text-(--pt-muted)">{body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** A white-ish card: the common frame for rails, directory cards and tiles. */
export function Card({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "aside" }) {
  return <Tag className={`rounded-(--pt-r) bg-(--pt-surface) p-6 shadow-[inset_0_0_0_1px_var(--pt-border)] sm:p-7 ${className}`}>{children}</Tag>;
}
