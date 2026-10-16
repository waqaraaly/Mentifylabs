import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Availability } from "@/components/practitioner/templates/Availability";
import { BookButton } from "@/components/practitioner/templates/BookButton";
import {
  Badges,
  Card,
  ContactButtons,
  ContactList,
  Credentials,
  FactList,
  HowBooking,
  Name,
  Portrait,
  SECTION_COPY,
  SectionTitle,
  rise,
  type SectionId,
} from "@/components/practitioner/templates/parts";
import { BookingCard, WRAP, blocks, firstName, toneStyle, type LayoutProps } from "@/components/practitioner/templates/shared";

// ---- clinic: a practice website ----

function ClinicActions({ m, center = false }: { m: LayoutProps["m"]; center?: boolean }) {
  return (
    <div className={`pt-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 ${center ? "justify-center" : ""}`} style={rise(3)}>
      <BookButton accepting={m.accepting} preview={m.preview} />
      {m.hasContact && (
        <a href="#contact" className="text-[15px] font-semibold text-(--pt-accent-text) underline underline-offset-[5px]">
          Get in touch
        </a>
      )}
    </div>
  );
}

function NextTimes({ m, className = "" }: { m: LayoutProps["m"]; className?: string }) {
  return (
    <div className={`rounded-(--pt-r) bg-(--pt-surface) p-4 shadow-[0_16px_36px_-20px_rgba(0,0,0,0.35)] ${className}`}>
      <p className="pt-label mb-2 text-(--pt-muted)">Next available</p>
      <Availability slots={m.slots} zone={m.practitioner.timezone} accepting={m.accepting} preview={m.preview} variant="chips" />
    </div>
  );
}

/** Three first screens for a practice site: photo beside the text (card), everything centred (band), or a quiet photo-left introduction (plain). */
function ClinicHero({ m, d }: LayoutProps) {
  const style = d.spec.header ?? "card";

  if (style === "band") {
    return (
      <section className="bg-(--pt-alt)">
        <div className={`${WRAP} flex max-w-3xl flex-col items-center py-12 text-center sm:py-16`}>
          <Portrait m={m} shape={d.shape} className="pt-rise w-36 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.45)] sm:w-44" />
          <p className="pt-label pt-rise mt-6 text-(--pt-accent-text)">{m.title}</p>
          <div className="pt-rise mt-3" style={rise(1)}>
            <Name m={m} size="text-[calc(clamp(2.2rem,5vw,3.4rem)*var(--pt-ds))] leading-[1.05]" />
          </div>
          {m.qualification && <p className="pt-rise mt-3 text-(--pt-muted)">{m.qualification}</p>}
          {m.headline && (
            <p className="pt-lede pt-rise mt-5 max-w-[44ch] text-(--pt-tagline) [overflow-wrap:anywhere]" style={rise(2)}>
              {m.headline}
            </p>
          )}
          <Badges m={m} className="pt-rise mt-6 justify-center" />
          <ClinicActions m={m} center />
          <NextTimes m={m} className="mt-8 w-full max-w-md text-left" />
        </div>
      </section>
    );
  }

  if (style === "plain") {
    return (
      <section className="border-b border-(--pt-border)">
        <div className={`${WRAP} py-12 sm:py-16`}>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-12">
            <Portrait m={m} shape={d.shape} className="pt-rise w-40 sm:w-52" />
            <div className="min-w-0 flex-1">
              <p className="pt-label pt-rise text-(--pt-accent-text)">{m.title}</p>
              <div className="pt-rise mt-3" style={rise(1)}>
                <Name m={m} size="text-[calc(clamp(2.2rem,4.8vw,3.4rem)*var(--pt-ds))] leading-[1.05]" />
              </div>
              {m.qualification && <p className="pt-rise mt-3 text-(--pt-muted)">{m.qualification}</p>}
              {m.headline && (
                <p className="pt-lede pt-rise mt-5 max-w-[50ch] text-(--pt-tagline) [overflow-wrap:anywhere]" style={rise(2)}>
                  {m.headline}
                </p>
              )}
              <Badges m={m} className="pt-rise mt-5" />
              <ClinicActions m={m} />
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-(--pt-r) bg-(--pt-alt) px-6 py-4">
            <span className="pt-label text-(--pt-muted)">Next available</span>
            <Availability slots={m.slots} zone={m.practitioner.timezone} accepting={m.accepting} preview={m.preview} variant="chips" className="flex-1" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-(--pt-alt)">
      <div className={`${WRAP} grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-20`}>
        <div>
          <p className="pt-label pt-rise text-(--pt-accent-text)">{m.title}</p>
          <div className="pt-rise mt-3" style={rise(1)}>
            <Name m={m} size="text-[calc(clamp(2.3rem,5.2vw,3.7rem)*var(--pt-ds))] leading-[1.04]" />
          </div>
          {m.qualification && <p className="pt-rise mt-3 text-[1.0625rem] text-(--pt-muted)">{m.qualification}</p>}
          {m.headline && (
            <p className="pt-lede pt-rise mt-5 max-w-[46ch] text-(--pt-tagline) [overflow-wrap:anywhere]" style={rise(2)}>
              {m.headline}
            </p>
          )}
          <Badges m={m} className="pt-rise mt-6" />
          <ClinicActions m={m} />
        </div>
        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <Portrait m={m} shape={d.shape} className="pt-rise mx-auto w-full max-w-sm shadow-[0_24px_50px_-28px_rgba(0,0,0,0.4)]" />
          <NextTimes m={m} className="relative z-10 mx-4 -mt-8 sm:mx-10" />
        </div>
      </div>
    </section>
  );
}

export function LayoutClinic({ m, d }: LayoutProps) {
  const list = blocks(m, d);
  const links: { id: string; label: string }[] = [
    ...(m.paragraphs.length ? [{ id: "about", label: "About" }] : []),
    ...(m.services.length ? [{ id: "services", label: "Services" }] : []),
    ...(m.education.length || m.experience.length ? [{ id: "journey", label: "Qualifications" }] : []),
    ...(m.hasContact ? [{ id: "contact", label: "Contact" }] : []),
  ];

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-(--pt-border) bg-(--pt-surface)/95 backdrop-blur">
        <div className={`${WRAP} flex h-16 items-center justify-between gap-4`}>
          <p className="pt-display min-w-0 truncate text-[1.15rem]">{m.practitioner.fullName}</p>
          <nav aria-label="Page sections" className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`} className="text-[0.95rem] font-medium text-(--pt-muted) transition hover:text-(--pt-text)">
                {l.label}
              </a>
            ))}
          </nav>
          <BookButton accepting={m.accepting} preview={m.preview} className="!px-4 !py-2 !text-sm" />
        </div>
      </header>

      <ClinicHero m={m} d={d} />

      {list.map((b, i) => (
        <section key={b.id} id={b.id} className={`scroll-mt-20 ${i % 2 === 1 ? "bg-(--pt-alt)/45" : ""}`}>
          <div className={`${WRAP} py-12 sm:py-16`}>
            <SectionTitle id={b.id} />
            <div className="max-w-4xl">{b.node}</div>
          </div>
        </section>
      ))}

      <section className={list.length % 2 === 1 ? "bg-(--pt-alt)/45" : ""}>
        <div className={`${WRAP} py-12 sm:py-16`}>
          <h2 className="pt-display pt-h2 mb-6">How booking works</h2>
          <HowBooking />
        </div>
      </section>

      <section id="contact" className="scroll-mt-20" style={toneStyle(d, "accent")}>
        <div className={`${WRAP} grid gap-10 py-14 sm:py-16 lg:grid-cols-2 lg:gap-16`}>
          <div>
            <h2 className="pt-display pt-h2">Book with {firstName(m)}</h2>
            {m.fee && <p className="mt-2 text-(--pt-muted)">Fee {m.fee}</p>}
            <div className="mt-6">
              <BookButton accepting={m.accepting} preview={m.preview} variant="inverse" />
            </div>
          </div>
          <ContactList m={m} />
        </div>
      </section>
    </div>
  );
}

// ---- directory: compact cards, built for phones ----

function formatCards(m: LayoutProps["m"]) {
  const type = m.practitioner.sessionType;
  const cards: { key: string; title: string; note?: string; slots: typeof m.slots }[] = [];
  if (type !== "offline") cards.push({ key: "online", title: "Online video session", slots: m.slots.filter((s) => s.sessionType !== "offline") });
  if (type !== "online") cards.push({ key: "offline", title: "On-site session", note: m.location, slots: m.slots.filter((s) => s.sessionType !== "online") });
  return cards;
}

export function LayoutDirectory({ m, d }: LayoutProps) {
  const list = blocks(m, d);
  const style = d.spec.header ?? "card";
  return (
    <div className={`mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:py-10`}>
      <Card className={`!p-5 sm:!p-7 ${style === "band" ? "overflow-hidden !pt-0" : ""} ${style === "plain" ? "!bg-transparent !p-0 !shadow-none" : ""}`}>
        {style === "band" && <div className="-mx-5 mb-[-2.5rem] h-24 bg-(--pt-alt) sm:-mx-7" />}
        <div className={`flex gap-4 sm:gap-6 ${style === "band" ? "relative items-end" : ""}`}>
          <Portrait m={m} shape={d.shape} className={`pt-rise w-24 sm:w-32 ${style === "band" ? "shadow-[0_0_0_5px_var(--pt-surface)]" : ""}`} />
          <div className="min-w-0 flex-1">
            <Name m={m} size="text-[calc(clamp(1.5rem,4vw,2rem)*var(--pt-ds))] leading-tight" />
            <Credentials m={m} className="mt-1.5 text-[0.98rem]" />
            <Badges m={m} show={["verified", "accepting"]} className="mt-3" />
          </div>
        </div>
        {m.stats.length > 0 && (
          <dl className="mt-5 grid grid-cols-3 divide-x divide-(--pt-border) border-t border-(--pt-border) pt-4 text-center">
            {m.stats.map((s) => (
              <div key={s.label} className="px-2">
                <dd className="pt-display text-[calc(1.1rem*var(--pt-ds))] leading-tight [overflow-wrap:anywhere]">{s.value}</dd>
                <dt className="mt-1 text-xs text-(--pt-muted)">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
        {m.headline && <p className="mt-5 text-[1rem] leading-relaxed text-(--pt-tagline) [overflow-wrap:anywhere]">{m.headline}</p>}
      </Card>

      {formatCards(m).map((c) => (
        <Card key={c.key} className="!p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="pt-display pt-h3">{c.title}</h2>
              {c.note && <p className="mt-0.5 text-[0.95rem] text-(--pt-muted) [overflow-wrap:anywhere]">{c.note}</p>}
              {m.fee && <p className="mt-2 font-semibold">{m.fee}</p>}
            </div>
            <BookButton accepting={m.accepting} preview={m.preview} className="!px-5 !py-2.5 !text-sm">
              Book appointment
            </BookButton>
          </div>
          <div className="mt-4 border-t border-(--pt-border) pt-4">
            <Availability slots={c.slots} zone={m.practitioner.timezone} accepting={m.accepting} preview={m.preview} variant="chips" />
          </div>
        </Card>
      ))}

      {list.map((b) => (
        <Card key={b.id} as="section" className="!p-5 sm:!p-7">
          <SectionTitle id={b.id} />
          {b.node}
        </Card>
      ))}

      {(m.hasContact || m.location) && (
        <Card as="section" className="!p-5 sm:!p-7">
          <div id="contact" className="scroll-mt-6">
            <SectionTitle id="contact" />
            <FactList m={m} className="mb-5" />
            <ContactList m={m} />
          </div>
        </Card>
      )}

      <Card className="!p-5 sm:!p-7">
        <h2 className="pt-display pt-h2 mb-5">How booking works</h2>
        <HowBooking />
      </Card>
    </div>
  );
}

// ---- narrative: a calm, readable story ----

const STORY_TITLES: Record<Exclude<SectionId, "contact">, string> = {
  about: "A little about me",
  expertise: "What I help with",
  services: "How we can work together",
  journey: "My background",
};

export function LayoutNarrative({ m, d }: LayoutProps) {
  const list = blocks(m, d);
  const style = d.spec.header ?? "card";
  const left = style === "band";
  const centered = style === "plain";
  return (
    <div className={`${WRAP} max-w-5xl`}>
      <div className={`grid items-start gap-10 py-10 sm:py-14 lg:gap-16 lg:py-20 ${centered ? "justify-items-center text-center" : left ? "lg:grid-cols-[17rem_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_17rem]"}`}>
        {centered && <Portrait m={m} shape={d.shape} className="pt-rise w-44 sm:w-52" />}
        {left && <Portrait m={m} shape={d.shape} className="pt-rise mx-auto w-56 lg:w-full" />}
        <div className={centered ? "flex flex-col items-center" : ""}>
          <p className="pt-label pt-rise text-(--pt-accent-text)">{m.title}</p>
          <div className="pt-rise mt-3" style={rise(1)}>
            <Name m={m} size="text-[calc(clamp(2.4rem,6vw,4rem)*var(--pt-ds))] leading-[1.02]" />
          </div>
          {m.qualification && <p className="pt-rise mt-3 text-[1.0625rem] text-(--pt-muted)">{m.qualification}</p>}
          {m.headline && (
            <blockquote
              className={`pt-display pt-rise mt-7 max-w-[34ch] text-[calc(clamp(1.3rem,2.6vw,1.75rem)*var(--pt-ds))] leading-snug [overflow-wrap:anywhere] ${centered ? "mx-auto text-center" : "border-l-4 border-(--pt-accent) pl-5"}`}
              style={rise(2)}
            >
              {m.headline}
            </blockquote>
          )}
          <Badges m={m} className="pt-rise mt-7" />
          <div className="pt-rise mt-7 flex flex-wrap items-center gap-x-6 gap-y-3" style={rise(3)}>
            <BookButton accepting={m.accepting} preview={m.preview} />
            {m.hasContact && (
              <a href="#contact" className="text-[15px] font-semibold text-(--pt-accent-text) underline underline-offset-[5px]">
                Get in touch
              </a>
            )}
          </div>
        </div>
        {!centered && !left && <Portrait m={m} shape={d.shape} className="pt-rise mx-auto w-56 lg:w-full" />}
      </div>

      <div className="grid gap-12 border-t border-(--pt-border) pt-12 pb-20 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-16">
        <div className="min-w-0 space-y-14">
          {list.map((b) => (
            <section key={b.id}>
              <SectionTitle id={b.id} title={STORY_TITLES[b.id]} />
              {b.node}
            </section>
          ))}
          <section>
            <h2 className="pt-display pt-h2 mb-5">What happens next</h2>
            <HowBooking />
          </section>
        </div>
        <aside id="contact" className="scroll-mt-6 space-y-6 self-start lg:sticky lg:top-6">
          <BookingCard m={m} />
          <Card>
            <h3 className="pt-display pt-h3 mb-4">Details</h3>
            <FactList m={m} />
            {m.hasContact && <div className="mt-5 border-t border-(--pt-border) pt-5"><ContactList m={m} /></div>}
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ---- card: one narrow column of big buttons ----

function Fold({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-t border-(--pt-border)">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-[1.02rem] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-5 shrink-0 text-(--pt-muted) transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-6 pb-6">{children}</div>
    </details>
  );
}

export function LayoutCard({ m, d }: LayoutProps) {
  const list = blocks(m, d);
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-14">
      <div className="overflow-hidden rounded-(--pt-r) bg-(--pt-surface) shadow-[0_30px_70px_-34px_rgba(0,0,0,0.5)]">
        <div className="h-28 bg-(--pt-alt)" />
        <div className="px-6 pb-7 text-center">
          <Portrait m={m} shape={d.shape} className="pt-rise mx-auto -mt-14 w-28 shadow-[0_0_0_5px_var(--pt-surface)]" />
          <div className="pt-rise mt-4" style={rise(1)}>
            <Name m={m} size="text-[calc(1.7rem*var(--pt-ds))] leading-tight" />
          </div>
          <Credentials m={m} className="mt-2 text-[0.98rem]" />
          <Badges m={m} show={["verified", "accepting", "formats"]} className="mt-4 justify-center" />
          {m.headline && <p className="mt-4 text-[0.98rem] leading-relaxed text-(--pt-tagline) [overflow-wrap:anywhere]">{m.headline}</p>}

          <div className="mt-6 grid gap-2.5 text-left">
            <BookButton accepting={m.accepting} preview={m.preview} className="w-full !py-4 !text-base" />
            <ContactButtons m={m} />
          </div>
          <div className="mt-5 text-left">
            <Availability slots={m.slots} zone={m.practitioner.timezone} accepting={m.accepting} preview={m.preview} variant="chips" />
          </div>
        </div>

        {list.map((b, i) => (
          <Fold key={b.id} title={SECTION_COPY[b.id]} open={i === 0}>
            {b.node}
          </Fold>
        ))}
        <Fold title="Details and contact">
          <FactList m={m} />
          {m.hasContact && <div className="mt-5"><ContactList m={m} /></div>}
        </Fold>
        <Fold title="How booking works">
          <HowBooking />
        </Fold>
      </div>
    </div>
  );
}

