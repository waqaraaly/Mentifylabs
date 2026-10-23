import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Availability } from "@/components/practitioner/templates/Availability";
import { BookButton } from "@/components/practitioner/templates/BookButton";
import { Links } from "@/components/practitioner/templates/layoutsC";
import type { Entry } from "@/components/practitioner/templates/model";
import { About, Expertise, Name, Portrait, SECTION_COPY, Services, rise } from "@/components/practitioner/templates/parts";
import type { LayoutProps } from "@/components/practitioner/templates/shared";

const BOOK = (
  <>
    Book a session
    <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
  </>
);

/** Photo, name, title, headline, the three quick facts and the contact icons, all centred. The booking button lives in the bar. */
function Top({ m, d }: LayoutProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <Portrait m={m} shape={d.shape} className="pt-rise w-40 sm:w-48" />
      <div className="pt-rise mt-5" style={rise(1)}>
        <Name m={m} />
      </div>
      <p className="pt-rise mt-1 font-bold tracking-[0.01em] text-(--pt-accent-text) [overflow-wrap:anywhere]">{m.title}</p>
      {m.headline && (
        <p className="pt-rise pt-display mt-3.5 max-w-[34ch] text-[1.0625rem] leading-snug font-normal! italic [text-wrap:balance] [overflow-wrap:anywhere]" style={rise(3)}>
          {m.headline}
        </p>
      )}
      <Links
        m={m}
        className="mt-6 flex flex-wrap justify-center gap-1.5 [&>a]:rounded-full [&>a]:border [&>a]:border-(--pt-border) [&>button]:rounded-full [&>button]:border [&>button]:border-(--pt-border)"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      {/* The rule runs out of the heading on the same line, so the two read as one header instead of a divider with a title under it. */}
      <div className="mb-7 flex items-center gap-4">
        <h2 className="pt-display shrink-0 text-[1.375rem] leading-none">{title}</h2>
        <span aria-hidden className="h-px min-w-6 flex-1 bg-(--pt-border)" />
      </div>
      {children}
    </section>
  );
}

/** Label and value rows: where and how the sessions run, and the fee. */
function Details({ rows }: { rows: { label: string; value: string; href?: string }[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-3.5 sm:grid-cols-[auto_1fr]">
      {rows.map((r) => (
        <div key={r.label} className="grid gap-0.5 sm:contents">
          <dt className="pt-label text-(--pt-muted) sm:pt-0.5">{r.label}</dt>
          <dd className="text-[1.0625rem] leading-snug font-semibold [overflow-wrap:anywhere]">
            {r.href ? (
              <a href={r.href} {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="underline decoration-(--pt-border) underline-offset-4 transition hover:decoration-(--pt-accent)">
                {r.value}
              </a>
            ) : (
              r.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Dotted list, two columns: used for the languages, as the services are. */
function Languages({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-x-7 gap-y-1.5 sm:grid-cols-2">
      {items.map((l) => (
        <li key={l} className="flex items-baseline gap-2.5 py-1 text-[1.0625rem] leading-snug">
          <span aria-hidden className="size-[5px] shrink-0 -translate-y-0.5 rounded-full bg-(--pt-accent)" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{l}</span>
        </li>
      ))}
    </ul>
  );
}

function Timeline({ label, entries, first }: { label: string; entries: Entry[]; first?: boolean }) {
  return (
    <div className={first ? "" : "mt-7"}>
      <h3 className="pt-label mb-3.5 text-(--pt-muted)">{label}</h3>
      <ol className="ml-1 grid gap-5 border-l-2 border-(--pt-border) pl-[22px]">
        {entries.map((e, i) => (
          <li key={`${e.title}-${i}`} className="relative">
            <span aria-hidden className="absolute top-[7px] -left-[29px] size-2.5 rounded-full border-2 border-(--pt-bg) bg-(--pt-accent)" />
            <p className="font-bold [overflow-wrap:anywhere]">{e.title}</p>
            {e.place && <p className="text-(--pt-muted) [overflow-wrap:anywhere]">{e.place}</p>}
            {e.years && <p className="text-(--pt-muted)">{e.years}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---- single column: identity and actions, sections in reading order, and a booking bar that stays at the bottom of the screen ----

export function LayoutRail({ m, d }: LayoutProps) {
  const { spec } = d;
  const groups = [
    { label: "Experience", entries: m.experience },
    { label: "Education", entries: m.education },
  ].filter((g) => g.entries.length > 0);
  const years = m.stats.find((x) => x.label === "Experience");
  // Email and phone are the icons under the name; any other public contact method (WhatsApp, a booking link) is listed here.
  const otherContacts = m.contacts
    .filter((c) => !c.href?.startsWith("mailto:") && !c.href?.startsWith("tel:"))
    .map((c) => ({ label: c.label, value: c.value, href: c.href }));
  const details: { label: string; value: string; href?: string }[] = [
    m.location && { label: "Location", value: m.location },
    m.formats.length > 0 && { label: "Sessions", value: m.formats.join(" and ") },
    m.fee && { label: "Session fee", value: m.fee },
    years && { label: "Experience", value: years.value },
    ...otherContacts,
  ].filter((r): r is { label: string; value: string; href?: string } => Boolean(r));
  return (
    <div>
      <div className="mx-auto w-full max-w-[680px] px-[18px] pt-8 pb-10 sm:px-7 sm:pt-12 sm:pb-14">
        <Top m={m} d={d} />
        {m.paragraphs.length > 0 && (
          <Section title={SECTION_COPY.about}>
            <About m={m} />
          </Section>
        )}
        {m.expertise.length > 0 && (
          <Section title={SECTION_COPY.expertise}>
            <Expertise items={m.expertise} variant={spec.expertise} />
          </Section>
        )}
        {m.services.length > 0 && (
          <Section title={SECTION_COPY.services}>
            <Services items={m.services} variant="bullets" />
          </Section>
        )}
        {details.length > 0 && (
          <Section title="Location and details">
            <Details rows={details} />
          </Section>
        )}
        {m.languages.length > 0 && (
          <Section title="Languages">
            <Languages items={m.languages} />
          </Section>
        )}
        {groups.length > 0 && (
          <Section title="Experience and education">
            {groups.map((g, i) => (
              <Timeline key={g.label} {...g} first={i === 0} />
            ))}
          </Section>
        )}
      </div>
      <div className="sticky bottom-0 z-10 border-t border-(--pt-border) bg-(--pt-bg)/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[18px] py-3.5 sm:px-7">
          <div className="flex min-w-0 flex-wrap items-center gap-x-7 gap-y-3">
            <Availability slots={m.slots} zone={m.practitioner.timezone} accepting={m.accepting} preview={m.preview} variant="stack" hideEmpty />
          </div>
          <BookButton accepting={m.accepting} preview={m.preview} className="shrink-0 !gap-2 !px-6 !py-[11px]">
            {BOOK}
          </BookButton>
        </div>
      </div>
    </div>
  );
}
