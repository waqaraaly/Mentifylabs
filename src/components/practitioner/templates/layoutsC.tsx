import { ArrowUpRight, Globe } from "lucide-react";
import type { ReactNode } from "react";
import { PLATFORM_ICON_PATH } from "@/components/practitioner/ContactLinks";
import { Availability } from "@/components/practitioner/templates/Availability";
import { BookButton } from "@/components/practitioner/templates/BookButton";
import type { ProfileModel } from "@/components/practitioner/templates/model";
import { Card, ContactList, FactList, HowBooking, Name, Portrait, SECTION_COPY, rise } from "@/components/practitioner/templates/parts";
import { blocks, firstName, type LayoutProps } from "@/components/practitioner/templates/shared";

// ---- folio: a quiet personal page. Identity stays on the left, everything else is read on the right ----

/** A small uppercase label over a hairline, the only kind of heading on this page. */
function Label({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mb-6 scroll-mt-8 border-b border-(--pt-border) pb-4 text-[13px] font-semibold tracking-[0.08em] text-(--pt-muted) uppercase">
      {children}
    </h2>
  );
}

function IconLink({ href, label, children, external = true }: { href: string; label: string; children: ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="grid size-11 place-items-center rounded-[10px] text-(--pt-muted) transition-colors duration-150 hover:bg-(--pt-border) hover:text-(--pt-text)"
    >
      {children}
    </a>
  );
}

function Links({ m }: { m: ProfileModel }) {
  if (m.socials.length === 0 && !m.website) return null;
  return (
    <nav aria-label="Links" className="-ml-2.5 mt-8 flex flex-wrap gap-2">
      {m.socials.map((s) => (
        <IconLink key={s.href} href={s.href} label={s.platform}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-[22px]" aria-hidden>
            <path d={PLATFORM_ICON_PATH[s.platform]} />
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

/** Who they are in four plain lines, then whether they are taking clients. No badges, no pills. */
function Identity({ m, d }: LayoutProps) {
  return (
    <>
      <Portrait m={m} shape={d.shape} className="pt-rise w-32 border border-(--pt-border) sm:w-36" />
      <div className="pt-rise mt-8" style={rise(1)}>
        <Name m={m} size="text-[calc(clamp(1.9rem,3vw,2.25rem)*var(--pt-ds))] leading-[1.15] !tracking-[-0.03em]" />
      </div>
      <p className="mt-2.5 text-lg font-medium [overflow-wrap:anywhere]">{m.title}</p>
      {m.qualification && <p className="mt-1 text-[0.95rem] leading-snug text-(--pt-muted) [overflow-wrap:anywhere]">{m.qualification}</p>}
      {m.location && <p className="mt-1 text-base text-(--pt-muted)">{m.location}</p>}

      <p className="mt-6 flex items-center gap-2.5 text-sm text-(--pt-muted)">
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${m.accepting ? "bg-(--pt-ok)" : "bg-(--pt-muted)"}`} />
        {m.accepting ? "Taking new clients" : "Not taking new clients"}
        {m.verified && <span className="before:mr-2.5 before:content-['·']">Verified</span>}
      </p>

      <Links m={m} />
    </>
  );
}

/** The way in: one card, laid out like the rest of the page's cards, with the booking action in its tinted foot. */
function BookingEntry({ m }: { m: ProfileModel }) {
  const meta = [m.formats.join(" and "), m.fee].filter(Boolean).join(" · ");
  return (
    <div className="overflow-hidden rounded-(--pt-r) border border-(--pt-border) bg-(--pt-surface) transition duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--pt-text)_25%,var(--pt-border))] hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="px-6 pt-6 pb-5">
        <h3 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">Book a session with {firstName(m)}</h3>
        {meta && <p className="mt-1 text-sm text-(--pt-muted)">{meta}</p>}
        {m.headline && <p className="mt-2.5 text-[15px] leading-relaxed text-(--pt-muted) [overflow-wrap:anywhere]">{m.headline}</p>}
        <div className="mt-5">
          <p className="mb-2 text-[13px] font-medium text-(--pt-muted)">Next available</p>
          <Availability slots={m.slots} zone={m.practitioner.timezone} accepting={m.accepting} preview={m.preview} variant="chips" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--pt-tint-strong) bg-(--pt-tint) px-6 py-3">
        <span className="text-sm font-medium text-(--pt-text)">{firstName(m)} confirms every request</span>
        <BookButton accepting={m.accepting} preview={m.preview} className="!px-4 !py-2 !text-sm">
          Request a time
          <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
        </BookButton>
      </div>
    </div>
  );
}

export function LayoutFolio({ m, d }: LayoutProps) {
  const list = blocks(m, d);
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-12 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-24">
      <aside className="pt-12 pb-2 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto lg:pt-28 lg:pb-14">
        <Identity m={m} d={d} />
      </aside>

      <div className="min-w-0 space-y-14 pt-10 pb-16 lg:pt-28 lg:pb-24">
        <section aria-label="Book a session">
          <Label>Book a session</Label>
          <BookingEntry m={m} />
        </section>

        {list.map((b) => (
          <section key={b.id} aria-labelledby={`folio-${b.id}`}>
            <Label id={`folio-${b.id}`}>{SECTION_COPY[b.id]}</Label>
            {b.node}
          </section>
        ))}

        {(m.hasContact || m.formats.length > 0 || m.languages.length > 0) && (
          <section id="contact" aria-labelledby="folio-contact" className="scroll-mt-8">
            <Label id="folio-contact">Details and contact</Label>
            <Card className="grid gap-8 !p-6 sm:grid-cols-2">
              <FactList m={m} />
              {m.contacts.length > 0 && <ContactList m={m} socials={false} />}
            </Card>
          </section>
        )}

        <section aria-labelledby="folio-how">
          <Label id="folio-how">How booking works</Label>
          <HowBooking />
        </section>
      </div>
    </div>
  );
}
