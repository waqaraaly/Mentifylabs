import type { ReactNode } from "react";
import type { ResolvedDesign } from "@/lib/templates";
import { BookButton } from "@/components/practitioner/templates/BookButton";
import type { ProfileModel } from "@/components/practitioner/templates/model";
import { About, ContactBlock, Expertise, Journey, SECTION_COPY, SectionHead, Services, Tile, type SectionId } from "@/components/practitioner/templates/parts";

interface BodyProps {
  m: ProfileModel;
  d: ResolvedDesign;
}

const WRAP = "mx-auto w-full max-w-6xl px-5 sm:px-8";

interface Block {
  id: SectionId;
  node: ReactNode;
}

/** The sections this profile actually has, in reading order. Empty ones are left out so no heading ever stands over nothing. */
function blocks(m: ProfileModel, d: ResolvedDesign, { dropcap = false }: { dropcap?: boolean } = {}): Block[] {
  const { spec } = d;
  const list: Block[] = [];
  if (m.paragraphs.length) list.push({ id: "about", node: <About m={m} dropcap={dropcap} /> });
  if (m.expertise.length) list.push({ id: "expertise", node: <Expertise items={m.expertise} variant={spec.expertise} /> });
  if (m.services.length) list.push({ id: "services", node: <Services items={m.services} variant={spec.services} /> });
  if (m.education.length || m.experience.length) list.push({ id: "journey", node: <Journey m={m} variant={spec.journey} /> });
  return list;
}

const dropcapFor = (d: ResolvedDesign) => d.spec.id === "paperback";

// ---- flow: one calm column, the contact card beside the first section ----

export function BodyFlow({ m, d }: BodyProps) {
  const list = blocks(m, d, { dropcap: dropcapFor(d) });
  const [first, ...rest] = list;
  const intro = first?.id === "about" ? first : undefined;
  const others = intro ? rest : list;

  return (
    <div className={`${WRAP} pb-24`}>
      {(intro || m.hasContact) && (
        <div className={`grid gap-12 border-t border-(--pt-border) py-14 sm:py-20 ${intro && m.hasContact ? "lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-20" : ""}`}>
          {intro && (
            <section>
              <SectionHead style={d.spec.heading} id="about" index={0} />
              {intro.node}
            </section>
          )}
          <div id="contact" className="scroll-mt-8 self-start lg:sticky lg:top-8">
            <ContactBlock m={m} tone="accent" />
          </div>
        </div>
      )}
      {others.map((b, i) => (
        <section key={b.id} className="border-t border-(--pt-border) py-14 sm:py-20">
          <SectionHead style={d.spec.heading} id={b.id} index={i + (intro ? 1 : 0)} />
          {b.node}
        </section>
      ))}
    </div>
  );
}

// ---- rail: a sticky side column with the contact details ----

export function BodyRail({ m, d }: BodyProps) {
  const list = blocks(m, d);
  return (
    <div className={`${WRAP} pb-24`}>
      <div className="grid gap-12 border-t border-(--pt-border) pt-14 sm:pt-20 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-20">
        <aside id="contact" className="order-last scroll-mt-8 space-y-5 self-start lg:sticky lg:top-8 lg:order-first">
          <ContactBlock m={m} tone="accent" />
          <BookButton accepting={m.accepting} preview={m.preview} variant="outline" className="w-full" />
        </aside>
        <div className="min-w-0 space-y-16 sm:space-y-24">
          {list.map((b, i) => (
            <section key={b.id}>
              <SectionHead style={d.spec.heading} id={b.id} index={i} />
              {b.node}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- bento: sections as tiles of different sizes ----

export function BodyBento({ m, d }: BodyProps) {
  const list = blocks(m, d);
  const has = (id: SectionId) => list.find((b) => b.id === id)?.node;
  const about = has("about");
  const expertise = has("expertise");
  const services = has("services");
  const journey = has("journey");
  const both = Boolean(expertise && services);
  const head = (id: SectionId) => <SectionHead style={d.spec.heading} id={id} className="!mb-6" />;

  return (
    <div className={`${WRAP} pb-24`}>
      <div className="grid gap-4 pt-4 lg:grid-cols-6">
        {about && (
          <Tile className={m.hasContact ? "lg:col-span-4" : "lg:col-span-6"}>
            {head("about")}
            {about}
          </Tile>
        )}
        {m.hasContact && (
          <div id="contact" className={`scroll-mt-8 ${about ? "lg:col-span-2" : "lg:col-span-6"}`}>
            <ContactBlock m={m} tone="accent" className="h-full" />
          </div>
        )}
        {expertise && (
          <Tile tone="tint" className={both ? "lg:col-span-3" : "lg:col-span-6"}>
            {head("expertise")}
            {expertise}
          </Tile>
        )}
        {services && (
          <Tile tone="alt" className={both ? "lg:col-span-3" : "lg:col-span-6"}>
            {head("services")}
            {services}
          </Tile>
        )}
        {journey && (
          <Tile className="lg:col-span-6">
            {head("journey")}
            {journey}
          </Tile>
        )}
      </div>
    </div>
  );
}

// ---- story: numbered chapters, label on the left, content on the right ----

export function BodyStory({ m, d }: BodyProps) {
  const list = blocks(m, d);
  const chapters: Block[] = [...list];
  if (m.hasContact) chapters.push({ id: "contact", node: <ContactBlock m={m} tone="plain" heading={false} /> });

  return (
    <div className={`${WRAP} pb-24`}>
      {chapters.map((b, i) => (
        <section key={b.id} id={b.id === "contact" ? "contact" : undefined} className="grid scroll-mt-8 gap-6 border-t border-(--pt-text) py-12 sm:py-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
          <header className="lg:sticky lg:top-8 lg:self-start">
            <p className="pt-label text-(--pt-accent)">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="pt-display mt-3 text-[calc(1.7rem*var(--pt-ds))] leading-tight">{SECTION_COPY[b.id].title}</h2>
          </header>
          <div className="min-w-0 max-w-3xl">{b.node}</div>
        </section>
      ))}
    </div>
  );
}
