import { Availability } from "@/components/practitioner/templates/Availability";
import { BookButton } from "@/components/practitioner/templates/BookButton";
import type { ProfileModel } from "@/components/practitioner/templates/model";
import {
  Badges,
  Card,
  ContactList,
  Credentials,
  FactList,
  HowBooking,
  Name,
  Portrait,
  SectionTitle,
  rise,
} from "@/components/practitioner/templates/parts";
import { BookingCard, WRAP, blocks, firstName, pageStyle, toneStyle, type Block, type LayoutProps } from "@/components/practitioner/templates/shared";

/** Photo, name, credentials, trust badges and the headline: the part every health profile opens with. */
function Identity({ m, d, photo = "w-28 sm:w-36" }: LayoutProps & { photo?: string }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
      <Portrait m={m} shape={d.shape} className={`pt-rise ${photo}`} />
      <div className="min-w-0 flex-1">
        <div className="pt-rise" style={rise(1)}>
          <Name m={m} />
        </div>
        <Credentials m={m} className="pt-rise mt-2" />
        <Badges m={m} className="pt-rise mt-4" />
        {m.headline && (
          <p className="pt-rise mt-5 max-w-[60ch] text-[1.0625rem] leading-relaxed text-(--pt-tagline) [overflow-wrap:anywhere]" style={rise(3)}>
            {m.headline}
          </p>
        )}
      </div>
    </div>
  );
}

function Header({ m, d }: LayoutProps) {
  const style = d.spec.header ?? "card";
  if (style === "band") {
    return (
      <div style={toneStyle(d)}>
        <div className={`${WRAP} py-9 sm:py-12`}>
          <Identity m={m} d={d} photo="w-28 sm:w-40" />
        </div>
      </div>
    );
  }
  if (style === "plain") {
    return (
      <div className={`${WRAP} py-9 sm:py-12`}>
        <Identity m={m} d={d} />
      </div>
    );
  }
  return (
    <div className={`${WRAP} pt-6 sm:pt-10`}>
      <Card className="!p-6 sm:!p-8">
        <Identity m={m} d={d} />
      </Card>
    </div>
  );
}

function InfoCard({ m, flat }: { m: ProfileModel; flat?: boolean }) {
  const body = (
    <>
      <h3 className="pt-display pt-h3 mb-4">Basic information</h3>
      <FactList m={m} />
      {m.hasContact && <div className="mt-5 border-t border-(--pt-border) pt-5"><ContactList m={m} /></div>}
    </>
  );
  return flat ? <div className="border-t border-(--pt-border) pt-6">{body}</div> : <Card>{body}</Card>;
}

function SectionList({ list, flat, id }: { list: Block[]; flat: boolean; id?: boolean }) {
  return (
    <>
      {list.map((b) =>
        flat ? (
          <section key={b.id} id={id ? b.id : undefined} className="scroll-mt-24 border-t border-(--pt-border) pt-8">
            <SectionTitle id={b.id} />
            {b.node}
          </section>
        ) : (
          <Card key={b.id} as="section">
            <div id={id ? b.id : undefined} className="scroll-mt-24">
              <SectionTitle id={b.id} />
              {b.node}
            </div>
          </Card>
        ),
      )}
    </>
  );
}

// ---- rail: identity, content, and a booking card that stays in view ----

export function LayoutRail({ m, d }: LayoutProps) {
  const flat = d.spec.header === "plain";
  const list = blocks(m, d);
  return (
    <div>
      <Header m={m} d={d} />
      <div className={`${WRAP} grid gap-8 pt-8 pb-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 ${flat ? "border-t border-(--pt-border) mt-0" : ""}`}>
        <div className="min-w-0 space-y-6">
          <SectionList list={list} flat={flat} />
          <Card className={flat ? "!bg-transparent !p-0 !shadow-none" : ""}>
            <h2 className="pt-display pt-h2 mb-5">How booking works</h2>
            <HowBooking />
          </Card>
        </div>
        <aside id="contact" className="scroll-mt-24 space-y-6 self-start lg:sticky lg:top-6">
          <BookingCard m={m} />
          <InfoCard m={m} />
        </aside>
      </div>
    </div>
  );
}

// ---- tabs: identity and booking side by side, then a tab bar that stays under the top of the screen ----

export function LayoutTabs({ m, d }: LayoutProps) {
  const list = blocks(m, d);
  const style = d.spec.header ?? "plain";
  const tabs: { id: string; label: string }[] = [
    ...list.map((b) => ({ id: b.id, label: b.id === "expertise" ? "Specialities" : b.id === "journey" ? "Background" : b.id === "about" ? "About" : "Services" })),
    ...(m.hasContact ? [{ id: "contact", label: "Contact" }] : []),
  ];

  const top = (
    <div className={`${WRAP} grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12`}>
      <Identity m={m} d={d} photo="w-28 sm:w-36" />
      <div style={pageStyle(d)}>
        <BookingCard m={m} />
      </div>
    </div>
  );

  return (
    <div>
      {style === "band" ? <div style={toneStyle(d)}>{top}</div> : style === "card" ? <div className="bg-(--pt-alt)">{top}</div> : top}

      <nav aria-label="Profile sections" className="sticky top-0 z-30 border-y border-(--pt-border) bg-(--pt-bg)/95 backdrop-blur">
        <div className={`${WRAP} flex gap-1 overflow-x-auto`}>
          {tabs.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="shrink-0 border-b-2 border-transparent px-4 py-3.5 text-[0.95rem] font-semibold text-(--pt-muted) transition hover:border-(--pt-accent) hover:text-(--pt-text)">
              {t.label}
            </a>
          ))}
        </div>
      </nav>

      <div className={`${WRAP} grid gap-10 pt-10 pb-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14`}>
        <div className="min-w-0 space-y-12">
          <SectionList list={list} flat id />
          <section className="border-t border-(--pt-border) pt-8">
            <h2 className="pt-display pt-h2 mb-5">How booking works</h2>
            <HowBooking />
          </section>
        </div>
        <aside id="contact" className="scroll-mt-24 space-y-6 self-start lg:sticky lg:top-20">
          <InfoCard m={m} />
        </aside>
      </div>
    </div>
  );
}

// ---- panel: a coloured side panel that stays put while the page scrolls beside it ----

export function LayoutPanel({ m, d }: LayoutProps) {
  const list = blocks(m, d);
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[23rem_minmax(0,1fr)] xl:grid-cols-[26rem_minmax(0,1fr)]">
      <aside style={toneStyle(d)} className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10 sm:px-10 lg:max-w-none lg:py-12">
          <Portrait m={m} shape={d.shape} className="pt-rise w-36 lg:w-44" />
          <div>
            <div className="pt-rise" style={rise(1)}>
              <Name m={m} size="text-[calc(1.9rem*var(--pt-ds))] leading-tight" />
            </div>
            <Credentials m={m} className="pt-rise mt-2" />
          </div>
          <Badges m={m} show={["verified", "accepting", "years"]} className="pt-rise" />
          <div className="rounded-(--pt-r) bg-(--pt-surface) p-5" style={pageStyle(d)}>
            <PanelBooking m={m} d={d} />
          </div>
          <div id="contact" className="scroll-mt-8">
            <ContactList m={m} />
          </div>
        </div>
      </aside>

      <div className="min-w-0 px-5 py-10 sm:px-10 lg:px-14 lg:py-14 xl:px-20">
        <div className="mx-auto max-w-3xl space-y-12">
          {m.headline && <p className="pt-display text-[calc(clamp(1.4rem,2.6vw,1.9rem)*var(--pt-ds))] leading-snug text-(--pt-tagline) [overflow-wrap:anywhere]">{m.headline}</p>}
          {list.map((b) => (
            <section key={b.id} className="scroll-mt-8">
              <SectionTitle id={b.id} />
              {b.node}
            </section>
          ))}
          <section>
            <h2 className="pt-display pt-h2 mb-5">How booking works</h2>
            <HowBooking />
          </section>
        </div>
      </div>
    </div>
  );
}

/** The booking block that sits in a white card inside the coloured panel, so its buttons keep the page's own colours. */
function PanelBooking({ m }: LayoutProps) {
  return (
    <div className="space-y-4">
      <h3 className="pt-display pt-h3">Book with {firstName(m)}</h3>
      <Availability slots={m.slots} zone={m.practitioner.timezone} accepting={m.accepting} preview={m.preview} variant="chips" />
      <BookButton accepting={m.accepting} preview={m.preview} className="w-full" />
      {m.fee && <p className="text-center text-sm text-(--pt-muted)">Fee {m.fee}</p>}
    </div>
  );
}

