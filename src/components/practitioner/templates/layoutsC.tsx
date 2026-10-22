import {
  ArrowUpRight,
  Banknote,
  Briefcase,
  Check,
  Globe,
  MapPin,
  Video,
} from "lucide-react";
import type { ReactNode } from "react";
import { PLATFORM_ICON_PATH } from "@/components/practitioner/ContactLinks";
import { Availability } from "@/components/practitioner/templates/Availability";
import { BookButton } from "@/components/practitioner/templates/BookButton";
import { ContactIcons } from "@/components/practitioner/templates/ContactIcons";
import type { ProfileModel } from "@/components/practitioner/templates/model";
import {
  Name,
  Portrait,
  SECTION_COPY,
  rise,
} from "@/components/practitioner/templates/parts";
import type { LayoutProps } from "@/components/practitioner/templates/shared";

// ---- folio: a quiet personal page. Identity stays on the left, everything else is read on the right ----

function IconLink({
  href,
  label,
  children,
  external = true,
}: {
  href: string;
  label: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="grid size-11 place-items-center rounded-[10px] text-(--pt-muted) transition-colors duration-150 hover:bg-(--pt-tint-strong) hover:text-(--pt-text)"
    >
      {children}
    </a>
  );
}

/** The shared Facebook glyph is a bare "f" made to sit on a blue disc; this page draws icons on their own, so it uses the full logo. */
const ICON_PATH: typeof PLATFORM_ICON_PATH = {
  ...PLATFORM_ICON_PATH,
  facebook:
    "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
};

/** Each network's own colour. X is black, so it follows the page's text colour and stays readable on the dark schemes. */
const BRAND_FILL: Partial<Record<keyof typeof ICON_PATH, string>> = {
  facebook: "#0866FF",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  instagram: "url(#folio-instagram)",
};

function Links({ m }: { m: ProfileModel }) {
  // Email and phone, if the practitioner made them public, are icons that open a window with the details.
  const find = (prefix: string) => {
    const c = m.contacts.find((x) => x.href?.startsWith(prefix));
    return c?.href ? { value: c.value, href: c.href } : undefined;
  };
  const email = find("mailto:");
  const phone = find("tel:");
  if (m.socials.length === 0 && !m.website && !email && !phone) return null;
  return (
    <nav
      aria-label="Contact and links"
      className="-ml-2.5 mt-8 flex flex-wrap gap-2"
    >
      <ContactIcons email={email} phone={phone} />
      {m.socials.map((s) => (
        <IconLink key={s.href} href={s.href} label={s.platform}>
          <svg
            viewBox="0 0 24 24"
            fill={BRAND_FILL[s.platform] ?? "var(--pt-text)"}
            className="size-[22px]"
            aria-hidden
          >
            {s.platform === "instagram" && (
              <defs>
                <linearGradient
                  id="folio-instagram"
                  x1="0"
                  y1="1"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0" stopColor="#FEDA77" />
                  <stop offset="0.35" stopColor="#F58529" />
                  <stop offset="0.6" stopColor="#DD2A7B" />
                  <stop offset="0.85" stopColor="#8134AF" />
                  <stop offset="1" stopColor="#515BD4" />
                </linearGradient>
              </defs>
            )}
            <path d={ICON_PATH[s.platform]} />
          </svg>
        </IconLink>
      ))}
      {m.website && (
        <IconLink href={m.website} label="Website">
          <Globe className="size-[22px]" strokeWidth={1.75} aria-hidden />
        </IconLink>
      )}
    </nav>
  );
}

/** The icon for each fact in the left column. Anything else gets a tick. */
const FACT_ICON: Record<string, typeof Check> = {
  Fee: Banknote,
  Experience: Briefcase,
  Sessions: Video,
};

function Fact({ fact }: { fact: { label: string; value: string } }) {
  const Icon = FACT_ICON[fact.label] ?? Check;
  return (
    <li className="flex items-start gap-3">
      <Icon
        className="mt-[0.2em] size-[1.05em] shrink-0 text-(--pt-muted)"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {fact.label === "Experience" ? `${fact.value} experience` : fact.value}
      </span>
    </li>
  );
}

export function LayoutLinkPage({ m, d }: LayoutProps) {
  const location = m.location?.trim();
  // The fee leads the list, then experience, how sessions are held and languages.
  const facts: { label: string; value: string }[] = [
    ...(m.fee ? [{ label: "Fee", value: m.fee }] : []),
    ...m.stats.filter((s) => s.label !== "Fee"),
  ];
  const groups = [
    { label: "Experience", list: m.experience },
    { label: "Education", list: m.education },
  ].filter((g) => g.list.length > 0);

  return (
    <div className="w-full px-4 sm:px-8 lg:grid lg:grid-cols-[372px_minmax(0,1fr)] lg:gap-32 lg:px-16">
      <aside className="pt-12 pb-8 lg:sticky lg:top-0 lg:-ml-3 lg:max-h-screen lg:self-start lg:overflow-y-auto lg:pl-3 lg:[scrollbar-width:none] lg:pt-16 lg:pb-16">
        <div className="w-fit">
          <Portrait
            m={m}
            shape={d.shape}
            className="pt-rise relative w-36 ring-4 ring-(--pt-bg) shadow-[0_0_0_1px_var(--pt-border),0_22px_44px_-20px_rgba(0,0,0,0.4)] sm:w-44"
          />
        </div>
        <div className="pt-rise mt-9" style={rise(1)}>
          <Name
            m={m}
            tick="text-[0.7em]"
            size="text-[calc(clamp(2rem,3vw,2.5rem)*var(--pt-ds))] leading-[1.1] !tracking-[-0.03em]"
          />
        </div>
        <p className="mt-3 text-base font-semibold text-(--pt-accent-text) [overflow-wrap:anywhere]">
          {m.title}
        </p>

        {m.headline && (
          <p className="mt-4 text-base leading-relaxed [overflow-wrap:anywhere]">
            {m.headline}
          </p>
        )}

        {location && (
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-(--pt-muted)">
            <MapPin className="size-4" aria-hidden />
            {location}
          </p>
        )}

        {facts.length > 0 && (
          <ul className="mt-6 space-y-3 text-[0.95rem]">
            {facts.map((f) => (
              <Fact key={f.label} fact={f} />
            ))}
          </ul>
        )}

        <div className="mt-6 [&>nav]:!mt-0">
          <Links m={m} />
        </div>

        {/* The soonest open time if there is one, then the button. With no open times the booking window says so. */}
        <Availability
          slots={m.slots}
          zone={m.practitioner.timezone}
          accepting={m.accepting}
          preview={m.preview}
          variant="line"
          hideEmpty
          className="mt-6"
        />
        <BookButton
          accepting={m.accepting}
          preview={m.preview}
          className="mt-3 !w-4/5 !gap-1.5 !py-3.5 !text-sm"
        >
          Book a session
          <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
        </BookButton>
      </aside>

      <div className="min-w-0 max-w-3xl pt-2 pb-20 lg:pt-16">
        {m.paragraphs.length > 0 && (
          <Row id="link-about" label={SECTION_COPY.about}>
            <div className="space-y-4 [overflow-wrap:anywhere]">
              {m.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="max-w-[68ch] text-[1.0625rem] leading-[1.8] whitespace-pre-line"
                >
                  {p}
                </p>
              ))}
            </div>
          </Row>
        )}

        {m.expertise.length > 0 && (
          <Row id="link-expertise" label={SECTION_COPY.expertise}>
            <ul className="flex flex-wrap gap-2.5">
              {m.expertise.map((e) => (
                <li
                  key={e}
                  className="rounded-md border border-[color-mix(in_srgb,var(--pt-text)_28%,transparent)] px-3.5 py-1.5 text-[0.95rem] leading-snug font-medium [overflow-wrap:anywhere]"
                >
                  {e}
                </li>
              ))}
            </ul>
          </Row>
        )}

        {m.services.length > 0 && (
          <Row id="link-services" label={SECTION_COPY.services}>
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {m.services.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-3 text-[1.0625rem] leading-snug"
                >
                  <Check
                    className="mt-[0.2em] size-[1.05em] shrink-0 text-(--pt-accent-text)"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{s}</span>
                </li>
              ))}
            </ul>
          </Row>
        )}

        {m.languages.length > 0 && (
          <Row id="link-languages" label="Languages">
            <ul className="grid max-w-[28rem] gap-x-10 gap-y-3 sm:grid-cols-2">
              {m.languages.map((l) => (
                <li
                  key={l}
                  className="flex items-baseline gap-3 text-[1.0625rem] leading-snug"
                >
                  <span
                    aria-hidden
                    className="size-[7px] shrink-0 -translate-y-px rounded-full bg-(--pt-accent)"
                  />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{l}</span>
                </li>
              ))}
            </ul>
          </Row>
        )}

        {groups.map((g) => (
          <Row key={g.label} id={`link-${g.label}`} label={g.label}>
            <ol className="space-y-6">
              {g.list.map((e, i) => (
                <li key={`${e.title}-${i}`}>
                  <p className="text-[1.0625rem] leading-snug font-semibold [overflow-wrap:anywhere]">
                    {e.title}
                  </p>
                  {e.place && (
                    <p className="mt-0.5 text-(--pt-muted) [overflow-wrap:anywhere]">
                      {e.place}
                    </p>
                  )}
                  {e.years && (
                    <p className="mt-0.5 text-sm text-(--pt-muted)">
                      {e.years}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Row>
        ))}
      </div>
    </div>
  );
}

/**
 * One section of the link page: a heading with its underline directly beneath it (a thin line with a short accent
 * segment at its start), then the content. Sections are separated by space, not by lines, so there is no stray line
 * above the first one or between two sections.
 */
function Row({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-14 first:mt-0">
      <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-(--pt-border) pb-4 after:absolute after:-bottom-px after:left-0 after:h-[3px] after:w-14 after:rounded-full after:bg-(--pt-accent) after:content-['']">
        <h2
          id={id}
          className="pt-display pt-h2 flex items-center gap-3 text-(--pt-text) [text-wrap:balance] before:size-[10px] before:shrink-0 before:rounded-[2px] before:bg-(--pt-accent) before:content-['']"
        >
          {label}
        </h2>
      </div>
      <div className="mt-6 min-w-0">{children}</div>
    </section>
  );
}
