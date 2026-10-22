import { ArrowUpRight, Briefcase, MapPin, Video } from "lucide-react";
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
  const years = m.stats.find((s) => s.label === "Experience");
  return (
    <div className="flex flex-col items-center text-center">
      <Portrait m={m} shape={d.shape} className="pt-rise w-32 sm:w-[7.75rem]" />
      <div className="pt-rise mt-5" style={rise(1)}>
        <Name m={m} />
      </div>
      <p className="pt-rise mt-1 font-bold tracking-[0.01em] text-(--pt-accent-text) [overflow-wrap:anywhere]">{m.title}</p>
      {m.headline && (
        <p className="pt-rise pt-display mt-3.5 max-w-[50ch] text-[1.0625rem] italic [overflow-wrap:anywhere]" style={rise(3)}>
          {m.headline}
        </p>
      )}
      <ul className="mt-[18px] flex flex-wrap justify-center gap-x-[18px] gap-y-2 text-sm text-(--pt-muted)">
        {m.location && (
          <li className="inline-flex items-center gap-[7px]">
            <MapPin className="size-[1.05em]" aria-hidden />
            {m.location}
          </li>
        )}
        {m.formats.length > 0 && (
          <li className="inline-flex items-center gap-[7px]">
            <Video className="size-[1.05em]" aria-hidden />
            {m.formats.join(" and ")}
          </li>
        )}
        {years && (
          <li className="inline-flex items-center gap-[7px]">
            <Briefcase className="size-[1.05em]" aria-hidden />
            {years.value} experience
          </li>
        )}
      </ul>
      <Links
        m={m}
        className="mt-6 flex flex-wrap justify-center gap-1.5 [&>a]:rounded-full [&>a]:border [&>a]:border-(--pt-border) [&>button]:rounded-full [&>button]:border [&>button]:border-(--pt-border)"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-11 border-t border-(--pt-border) pt-7">
      <h2 className="pt-display pt-h2 mb-3.5">{title}</h2>
      {children}
    </section>
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
          <div className="min-w-0 space-y-0.5">
            <Availability slots={m.slots} zone={m.practitioner.timezone} accepting={m.accepting} preview={m.preview} variant="line" hideEmpty />
            {m.fee && (
              <p className="text-sm text-(--pt-muted)">
                Session fee <b className="ml-1 font-bold text-(--pt-text)">{m.fee}</b>
              </p>
            )}
          </div>
          <BookButton accepting={m.accepting} preview={m.preview} className="shrink-0 !gap-2 !px-6 !py-[11px]">
            {BOOK}
          </BookButton>
        </div>
      </div>
    </div>
  );
}
