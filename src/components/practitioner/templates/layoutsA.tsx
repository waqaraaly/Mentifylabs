import type { ProfileModel } from "@/components/practitioner/templates/model";
import {
  Card,
  ContactList,
  FactList,
  Name,
  Portrait,
  SectionTitle,
  rise,
} from "@/components/practitioner/templates/parts";
import { BookingCard, WRAP, blocks, toneStyle, type Block, type LayoutProps } from "@/components/practitioner/templates/shared";

/** Photo, name, title and the headline. Every other detail is shown once, in the information card beside the sections. */
function Identity({ m, d, photo = "w-28 sm:w-36" }: LayoutProps & { photo?: string }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
      <Portrait m={m} shape={d.shape} className={`pt-rise ${photo}`} />
      <div className="min-w-0 flex-1">
        <div className="pt-rise" style={rise(1)}>
          <Name m={m} />
        </div>
        <p className="pt-rise mt-2 text-[1.0625rem] font-semibold text-(--pt-accent-text) [overflow-wrap:anywhere]">{m.title}</p>
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
        </div>
        <aside id="contact" className="scroll-mt-24 space-y-6 self-start lg:sticky lg:top-6">
          <BookingCard m={m} />
          <InfoCard m={m} />
        </aside>
      </div>
    </div>
  );
}
