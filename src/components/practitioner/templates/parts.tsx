import type { CSSProperties, ComponentType, ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Globe, Languages, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { VerifiedBadge, VerifiedTooltip } from "@/components/practitioner/ProfileHero";
import { BRAND_BACKGROUND, PLATFORM_ICON_PATH } from "@/components/practitioner/ContactLinks";
import type { ExpertiseStyle, HeadingStyle, JourneyStyle, PhotoShape, ServicesStyle } from "@/lib/templates";
import type { Entry, ProfileModel, Stat } from "@/components/practitioner/templates/model";

/** Sets how far into the page's entrance sequence an element appears. */
export const rise = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

// ---- Portrait ----

export const SHAPE_STYLE: Record<PhotoShape, { aspect: string; radius: string }> = {
  circle: { aspect: "1 / 1", radius: "9999px" },
  arch: { aspect: "4 / 5", radius: "50% 50% 14px 14px / 40% 40% 14px 14px" },
  rounded: { aspect: "4 / 5", radius: "var(--pt-photo-r, 28px)" },
  oval: { aspect: "4 / 5", radius: "50%" },
  blob: { aspect: "4 / 5", radius: "60% 40% 30% 70% / 55% 45% 65% 35%" },
  square: { aspect: "4 / 5", radius: "0" },
};

/** The practitioner's photo in the template's shape, or their initials when there is no photo. */
export function Portrait({ m, shape, className = "", style }: { m: ProfileModel; shape: PhotoShape; className?: string; style?: CSSProperties }) {
  const { aspect, radius } = SHAPE_STYLE[shape];
  const { photoUrl, fullName } = m.practitioner;
  return (
    <div className={`relative overflow-hidden bg-(--pt-tint-strong) ${className}`} style={{ aspectRatio: aspect, borderRadius: radius, ...style }}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={`Portrait of ${fullName}`} className="size-full object-cover" />
      ) : (
        <div role="img" aria-label={`${fullName}'s portrait`} className="pt-display flex size-full items-center justify-center text-[clamp(3rem,9vw,5.5rem)] text-(--pt-accent)">
          {m.initials}
        </div>
      )}
    </div>
  );
}

/** A full-bleed photo (or initials) that fills its parent. */
export function Bleed({ m }: { m: ProfileModel }) {
  const { photoUrl, fullName } = m.practitioner;
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt={`Portrait of ${fullName}`} className="absolute inset-0 size-full object-cover" />
  ) : (
    <div role="img" aria-label={`${fullName}'s portrait`} className="pt-display absolute inset-0 flex items-center justify-center bg-(--pt-tint-strong) text-[clamp(6rem,20vw,14rem)] text-(--pt-accent)">
      {m.initials}
    </div>
  );
}

// ---- Name, title, headline ----

export function Verified({ className = "size-[0.5em]" }: { className?: string }) {
  return (
    <VerifiedTooltip label="Verified practitioner">
      <VerifiedBadge className={`${className} shrink-0`} />
    </VerifiedTooltip>
  );
}

/** The name as a heading. `split` puts the surname on its own line in the accent colour (or a second style). */
export function Name({
  m,
  size = "pt-h1",
  split = false,
  lastClass = "",
  className = "",
}: {
  m: ProfileModel;
  size?: string;
  split?: boolean;
  lastClass?: string;
  className?: string;
}) {
  return (
    <h1 className={`pt-display ${size} [overflow-wrap:anywhere] ${className}`}>
      {m.firstNames}
      {m.lastName && (split ? <br /> : " ")}
      {m.lastName && <span className={lastClass}>{m.lastName}</span>}
      {m.verified && (
        <span className="ml-[0.3em] inline-flex align-middle text-[0.45em]">
          <Verified className="size-[1em]" />
        </span>
      )}
    </h1>
  );
}

export function Stats({ stats, variant = "row", className = "" }: { stats: Stat[]; variant?: "row" | "chips" | "boxes" | "plain"; className?: string }) {
  if (stats.length === 0) return null;

  if (variant === "chips") {
    return (
      <ul className={`flex flex-wrap gap-2 ${className}`}>
        {stats.map((s) => (
          <li key={s.label} className="rounded-full bg-(--pt-surface) px-4 py-2 text-sm shadow-[inset_0_0_0_1px_var(--pt-border)]">
            <span className="text-(--pt-muted)">{s.label}</span> <span className="font-semibold">{s.value}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "boxes") {
    return (
      <dl className={`grid gap-3 sm:grid-cols-3 ${className}`}>
        {stats.map((s) => (
          <div key={s.label} className="rounded-(--pt-r) bg-(--pt-surface) px-5 py-4 shadow-[inset_0_0_0_1px_var(--pt-border)]">
            <dt className="pt-label text-(--pt-muted)">{s.label}</dt>
            <dd className="pt-display mt-1.5 text-xl">{s.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={`flex flex-wrap gap-x-10 gap-y-5 ${variant === "row" ? "border-t border-(--pt-border) pt-6" : ""} ${className}`}>
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="pt-label text-(--pt-muted)">{s.label}</dt>
          <dd className="pt-display mt-1.5 text-[calc(1.35rem*var(--pt-ds))]">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---- Section headings ----

export type SectionId = "about" | "expertise" | "services" | "journey" | "contact";

export const SECTION_COPY: Record<SectionId, { title: string; kicker: string }> = {
  about: { title: "About me", kicker: "Who I am" },
  expertise: { title: "Areas of expertise", kicker: "What I help with" },
  services: { title: "Services offered", kicker: "How we can work together" },
  journey: { title: "Education and experience", kicker: "Where I trained" },
  contact: { title: "Get in touch", kicker: "Say hello" },
};

export function SectionHead({ style, id, index, className = "" }: { style: HeadingStyle; id: SectionId; index?: number; className?: string }) {
  const { title, kicker } = SECTION_COPY[id];
  const num = index === undefined ? "" : String(index + 1).padStart(2, "0");

  return (
    <header className={`mb-8 sm:mb-10 ${className}`}>
      {style === "eyebrow" && <p className="pt-label mb-3 text-(--pt-accent)">{kicker}</p>}
      {style === "numbered" && num && <p className="pt-label mb-3 text-(--pt-accent)">{num} /</p>}
      {style === "script" && <p className="mb-1 -rotate-2 font-(family-name:--f-caveat) text-[1.7rem] leading-none text-(--pt-accent)">{kicker}</p>}
      <h2 className="pt-display pt-h2">{title}</h2>
      {style === "underline" && <span aria-hidden className="mt-4 block h-[3px] w-14 rounded-full bg-(--pt-accent)" />}
    </header>
  );
}

// ---- About ----

export function About({ m, lede = true, dropcap = false, className = "" }: { m: ProfileModel; lede?: boolean; dropcap?: boolean; className?: string }) {
  if (m.paragraphs.length === 0) return null;
  const [first, ...rest] = m.paragraphs;
  return (
    <div className={`space-y-5 [overflow-wrap:anywhere] ${className}`}>
      <p className={`whitespace-pre-line ${lede ? "pt-lede" : "text-[1.0625rem] leading-[1.8]"} ${dropcap ? "pt-dropcap" : ""}`}>{first}</p>
      {rest.map((paragraph, i) => (
        <p key={i} className="max-w-[62ch] text-[1.0625rem] leading-[1.8] whitespace-pre-line text-(--pt-tagline)">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

// ---- Expertise ----

export function Expertise({ items, variant }: { items: string[]; variant: ExpertiseStyle }) {
  if (items.length === 0) return null;
  return (
    <div className="@container">
      <ExpertiseList items={items} variant={variant} />
    </div>
  );
}

function ExpertiseList({ items, variant }: { items: string[]; variant: ExpertiseStyle }) {

  if (variant === "chips") {
    return (
      <ul className="flex flex-wrap gap-2.5">
        {items.map((item) => (
          <li key={item} className="rounded-full bg-(--pt-surface) px-4.5 py-2.5 text-[15px] font-medium shadow-[inset_0_0_0_1px_var(--pt-border)] [overflow-wrap:anywhere]">
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "rules") {
    return (
      <ul className="border-t border-(--pt-text)">
        {items.map((item, i) => (
          <li key={item} className="flex items-baseline justify-between gap-6 border-b border-(--pt-border) py-4">
            <span className="pt-display text-[calc(1.5rem*var(--pt-ds))] leading-tight [overflow-wrap:anywhere]">{item}</span>
            <span className="pt-label shrink-0 text-(--pt-muted)">{String(i + 1).padStart(2, "0")}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "tiles") {
    return (
      <ul className="grid gap-3 @sm:grid-cols-2 @3xl:grid-cols-3">
        {items.map((item, i) => (
          <li
            key={item}
            className={`flex items-start gap-3 rounded-(--pt-r) p-5 text-base font-medium shadow-[inset_0_0_0_1px_var(--pt-border)] ${i % 3 === 0 ? "bg-(--pt-tint)" : "bg-(--pt-surface)"}`}
          >
            <span aria-hidden className="mt-[0.5em] size-2 shrink-0 rounded-full bg-(--pt-accent)" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "cloud") {
    return (
      <p className="pt-display text-[calc(clamp(1.6rem,3vw,2.3rem)*var(--pt-ds))] leading-[1.3]">
        {items.map((item, i) => (
          <span key={item}>
            <span className={i % 2 ? "text-(--pt-accent)" : ""}>{item}</span>
            {i < items.length - 1 && <span aria-hidden className="mx-[0.45em] text-(--pt-muted) opacity-60">/</span>}
          </span>
        ))}
      </p>
    );
  }

  return (
    <ul className="grid gap-x-12 sm:grid-cols-2">
      {items.map((item, i) => (
        <li key={item} className="flex items-baseline gap-4 border-t border-(--pt-border) py-4">
          <span className="pt-label shrink-0 text-(--pt-accent)">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-lg font-medium [overflow-wrap:anywhere]">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ---- Services ----

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
        {items.map((item, i) => (
          <li key={item} className="flex min-h-36 flex-col justify-between gap-6 rounded-(--pt-r) bg-(--pt-surface) p-6 shadow-[inset_0_0_0_1px_var(--pt-border)]">
            <span className="pt-label flex size-9 items-center justify-center rounded-full bg-(--pt-tint-strong) text-(--pt-text)">{i + 1}</span>
            <span className="pt-display pt-h3 [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "numbered") {
    return (
      <ol>
        {items.map((item, i) => (
          <li key={item} className="grid grid-cols-[3.2rem_1fr] items-baseline gap-4 border-b border-(--pt-border) py-5 first:border-t sm:grid-cols-[5rem_1fr]">
            <span className="pt-display text-[calc(2.4rem*var(--pt-ds))] leading-none text-(--pt-accent)">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[1.25rem] leading-snug font-medium [overflow-wrap:anywhere] sm:text-[1.4rem]">{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (variant === "rows") {
    return (
      <ul className="border-t border-(--pt-text)/80">
        {items.map((item) => (
          <li key={item} className="group flex items-center justify-between gap-6 border-b border-(--pt-border) py-5">
            <span className="pt-display text-[calc(clamp(1.35rem,2.4vw,1.9rem)*var(--pt-ds))] leading-tight [overflow-wrap:anywhere]">{item}</span>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_var(--pt-border)] transition duration-300 group-hover:bg-(--pt-accent) group-hover:text-(--pt-accent-foreground) group-hover:shadow-none">
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item} className="group flex items-start gap-4 text-[1.2rem] leading-snug font-medium sm:text-[1.35rem]">
          <ArrowRight className="mt-[0.25em] size-[1em] shrink-0 text-(--pt-accent) transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.25} aria-hidden />
          <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ---- Journey ----

function Years({ years }: { years: string }) {
  return years ? <p className="pt-label text-(--pt-accent)">{years}</p> : null;
}

function JourneyGroup({ label, entries, variant }: { label: string; entries: Entry[]; variant: JourneyStyle }) {
  return (
    <div>
      <h3 className="pt-label mb-5 text-(--pt-muted)">{label}</h3>

      {variant === "rail" && (
        <ol className="ml-1.5 space-y-7 border-l border-(--pt-border) pl-7">
          {entries.map((e, i) => (
            <li key={`${e.title}-${i}`} className="relative">
              <span aria-hidden className="absolute top-[0.35rem] -left-[calc(1.75rem+3.5px)] size-[7px] rounded-full bg-(--pt-accent) ring-[5px] ring-(--pt-bg)" />
              <Years years={e.years} />
              <p className="mt-1 text-[1.1rem] leading-snug font-semibold [overflow-wrap:anywhere]">{e.title}</p>
              {e.place && <p className="mt-0.5 text-(--pt-muted) [overflow-wrap:anywhere]">{e.place}</p>}
            </li>
          ))}
        </ol>
      )}

      {variant === "rows" && (
        <ol className="border-t border-(--pt-text)/70">
          {entries.map((e, i) => (
            <li key={`${e.title}-${i}`} className="grid gap-1 border-b border-(--pt-border) py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <span className="pt-label pt-1 text-(--pt-muted)">{e.years || "—"}</span>
              <span>
                <span className="block text-[1.1rem] font-semibold [overflow-wrap:anywhere]">{e.title}</span>
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
              {e.years && <span className="pt-label inline-block rounded-full bg-(--pt-tint) px-3 py-1 text-(--pt-text)">{e.years}</span>}
              <p className="mt-3 text-[1.1rem] leading-snug font-semibold [overflow-wrap:anywhere]">{e.title}</p>
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
    { label: "Education", entries: m.education },
    { label: "Experience", entries: m.experience },
  ].filter((g) => g.entries.length > 0);
  if (groups.length === 0) return null;
  const sideBySide = groups.length > 1 && variant !== "rows";

  return (
    <div className={sideBySide ? "grid gap-12 md:grid-cols-2" : "space-y-12"}>
      {groups.map((g) => (
        <JourneyGroup key={g.label} {...g} variant={variant} />
      ))}
    </div>
  );
}

// ---- Contact ----

const CONTACT_ICON: Record<string, ComponentType<{ className?: string }>> = { Email: Mail, Phone };

function ContactRow({ icon: Icon, label, value, href, tone }: { icon: ComponentType<{ className?: string }>; label: string; value: string; href?: string; tone: Tone }) {
  const inner = (
    <>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone === "accent" ? "bg-white/15" : "bg-(--pt-tint-strong)"}`}>
        <Icon className="size-[17px]" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className={`pt-label block ${tone === "accent" ? "opacity-70" : "text-(--pt-muted)"}`}>{label}</span>
        <span className="mt-0.5 block text-[15px] leading-snug font-medium [overflow-wrap:anywhere]">{value}</span>
      </span>
    </>
  );
  const cls = `flex items-center gap-4 py-3.5 ${href ? "transition hover:opacity-75" : ""}`;
  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

type Tone = "accent" | "surface" | "plain";

/** The contact details, in three looks: a coloured panel, a card, or plain lines. Not drawn at all when there is nothing to show. */
export function ContactBlock({ m, tone = "surface", heading = true, className = "" }: { m: ProfileModel; tone?: Tone; heading?: boolean; className?: string }) {
  if (!m.hasContact) return null;
  const toneClass =
    tone === "accent"
      ? "bg-(--pt-accent) text-(--pt-accent-foreground) rounded-(--pt-r) p-7 sm:p-8"
      : tone === "surface"
        ? "bg-(--pt-surface) rounded-(--pt-r) p-7 shadow-[inset_0_0_0_1px_var(--pt-border)] sm:p-8"
        : "";
  const hasLinks = m.socials.length > 0 || m.website;

  return (
    <div className={`${toneClass} ${className}`}>
      {heading && <h3 className="pt-display pt-h3 mb-2">Get in touch</h3>}
      <div className="divide-y divide-current/10">
        {m.contacts.map((c) => (
          <ContactRow key={c.label} icon={CONTACT_ICON[c.label] ?? MessageCircle} label={c.label} value={c.value} href={c.href} tone={tone} />
        ))}
        {m.location && <ContactRow icon={MapPin} label="Location" value={m.location} tone={tone} />}
        {m.languages.length > 0 && <ContactRow icon={Languages} label="Languages" value={m.languages.join(", ")} tone={tone} />}
      </div>
      {hasLinks && (
        <div className="mt-4 flex flex-wrap gap-2">
          {m.socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.platform}
              className="flex size-10 items-center justify-center rounded-full text-white shadow-sm transition hover:-translate-y-0.5"
              style={{ background: BRAND_BACKGROUND[s.platform] ?? "var(--pt-text)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
                <path d={PLATFORM_ICON_PATH[s.platform]} />
              </svg>
            </a>
          ))}
          {m.website && (
            <a
              href={m.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Website"
              className="flex size-10 items-center justify-center rounded-full shadow-[inset_0_0_0_1.5px_currentColor] transition hover:-translate-y-0.5"
            >
              <Globe className="size-[17px]" aria-hidden />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** A thin frame for a section's content: used by bodies that put each section in a tile. */
export function Tile({ children, className = "", tone = "surface" }: { children: ReactNode; className?: string; tone?: "surface" | "tint" | "alt" | "accent" }) {
  const t = {
    surface: "bg-(--pt-surface) shadow-[inset_0_0_0_1px_var(--pt-border)]",
    tint: "bg-(--pt-tint)",
    alt: "bg-(--pt-alt) text-(--pt-alt-foreground)",
    accent: "bg-(--pt-accent) text-(--pt-accent-foreground)",
  }[tone];
  return <section className={`rounded-(--pt-r) p-7 sm:p-9 ${t} ${className}`}>{children}</section>;
}
