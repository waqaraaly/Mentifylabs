import { ArrowUpRight, Banknote, Check, Globe, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { PLATFORM_ICON_PATH } from "@/components/practitioner/ContactLinks";
import { Availability } from "@/components/practitioner/templates/Availability";
import { BookButton } from "@/components/practitioner/templates/BookButton";
import type { ProfileModel } from "@/components/practitioner/templates/model";
import {
  Badges,
  ContactList,
  Expertise,
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
  if (m.socials.length === 0 && !m.website) return null;
  return (
    <nav aria-label="Links" className="-ml-2.5 mt-8 flex flex-wrap gap-2">
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

export function LayoutLinkPage({ m, d }: LayoutProps) {
  const location = m.location?.trim();
  const facts = m.stats.filter((s) => s.label !== "Fee");
  if (m.languages.length)
    facts.push({ label: "Languages", value: m.languages.join(", ") });
  const groups = [
    { label: "Education", list: m.education },
    { label: "Experience", list: m.experience },
  ].filter((g) => g.list.length > 0);

  return (
    <div className="w-full px-4 sm:px-8 lg:grid lg:grid-cols-[372px_minmax(0,1fr)] lg:gap-32 lg:px-16">
      <aside className="pt-12 pb-8 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto lg:[scrollbar-width:none] lg:pt-16 lg:pb-16">
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
            size="text-[calc(clamp(2rem,3vw,2.5rem)*var(--pt-ds))] leading-[1.1] !tracking-[-0.03em]"
          />
        </div>
        <p className="mt-3 inline-flex rounded-full bg-(--pt-tint) px-3.5 py-1.5 text-sm font-semibold text-(--pt-accent-text) shadow-[inset_0_0_0_1px_var(--pt-tint-strong)] [overflow-wrap:anywhere]">
          {m.title}
        </p>

        {m.verified && <Badges m={m} show={["verified"]} className="mt-3" />}

        {(location || m.fee) && (
          <ul className="mt-4 flex flex-wrap gap-2 text-sm text-(--pt-muted)">
            {location && (
              <li className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-[inset_0_0_0_1px_var(--pt-border)]">
                <MapPin className="size-4" aria-hidden />
                {location}
              </li>
            )}
            {m.fee && (
              <li className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-[inset_0_0_0_1px_var(--pt-border)]">
                <Banknote className="size-4" aria-hidden />
                {m.fee}
              </li>
            )}
          </ul>
        )}

        {m.headline && (
          <p className="mt-7 border-l-[3px] border-(--pt-accent) pl-4 text-[1.15rem] leading-snug font-semibold [overflow-wrap:anywhere]">
            {m.headline}
          </p>
        )}

        {facts.length > 0 && (
          <dl className="mt-7 border-t border-(--pt-border) text-[0.95rem]">
            {facts.map((s) => (
              <div
                key={s.label}
                className="flex items-baseline justify-between gap-4 border-b border-(--pt-border) py-3"
              >
                <dt className="text-(--pt-muted)">{s.label}</dt>
                <dd className="text-right font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-7 rounded-2xl bg-(--pt-tint) p-4 shadow-[inset_0_0_0_1px_var(--pt-tint-strong)]">
          <Availability
            slots={m.slots}
            zone={m.practitioner.timezone}
            accepting={m.accepting}
            preview={m.preview}
            variant="line"
          />
          <BookButton
            accepting={m.accepting}
            preview={m.preview}
            className="mt-3.5 w-full"
          >
            Book a session
            <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
          </BookButton>
        </div>

        <div className="mt-8 border-t border-(--pt-border) pt-6 [&>nav]:!mt-0">
          <Links m={m} />
        </div>
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
            <Expertise items={m.expertise} variant="chips" />
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

        {m.contacts.length > 0 && (
          <Row id="link-contact" label={SECTION_COPY.contact}>
            <ContactList m={m} socials={false} />
          </Row>
        )}
      </div>
    </div>
  );
}

/** One row of the link page, laid out like a CV: the label in a narrow column, the content beside it, a hairline between rows. */
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
    <section
      aria-labelledby={id}
      className="grid gap-3 border-t border-(--pt-border) py-9 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-10"
    >
      <h2
        id={id}
        className="text-[0.95rem] font-semibold text-(--pt-muted) sm:pt-0.5"
      >
        {label}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
