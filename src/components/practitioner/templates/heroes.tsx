import type { CSSProperties, ReactNode } from "react";
import { mix } from "@/lib/color";
import type { PhotoShape, ResolvedDesign } from "@/lib/templates";
import { BookButton } from "@/components/practitioner/templates/BookButton";
import type { ProfileModel } from "@/components/practitioner/templates/model";
import { Bleed, Name, Portrait, SHAPE_STYLE, Stats, rise } from "@/components/practitioner/templates/parts";

interface HeroProps {
  m: ProfileModel;
  d: ResolvedDesign;
}

const WRAP = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const decoClass = (d: ResolvedDesign) => (d.spec.deco === "dots" ? "pt-dots" : d.spec.deco === "lines" ? "pt-lines" : "");

/** Text on a coloured panel is read against the panel, not the page, so the panel carries its own text colours. */
function panelStyle(d: ResolvedDesign): CSSProperties {
  const on = d.vars["--pt-alt-foreground"];
  const alt = d.palette.alt;
  return {
    background: alt,
    color: on,
    "--pt-text": on,
    "--pt-muted": mix(on, alt, 0.7),
    "--pt-tagline": mix(on, alt, 0.88),
    "--pt-border": mix(on, alt, 0.3),
  } as CSSProperties;
}

function ContactLink() {
  return (
    <a href="#contact" className="text-[15px] font-semibold underline decoration-1 underline-offset-[6px] transition hover:decoration-2">
      Get in touch
    </a>
  );
}

/** Title, name, headline, facts and the booking button: the part of every hero that says who this is. */
function Intro({
  m,
  align = "left",
  panel = false,
  stats = "row",
  split = false,
  lastClass = "",
  size = "pt-h1",
  children,
}: {
  m: ProfileModel;
  align?: "left" | "center";
  panel?: boolean;
  stats?: "row" | "chips" | "boxes" | "plain" | "none";
  split?: boolean;
  lastClass?: string;
  size?: string;
  children?: ReactNode;
}) {
  const center = align === "center";
  return (
    <div className={center ? "flex flex-col items-center text-center" : ""}>
      <p className={`pt-label pt-rise ${panel ? "opacity-75" : "text-(--pt-accent)"}`} style={rise(1)}>
        {m.title}
      </p>
      <div className="pt-rise mt-4" style={rise(2)}>
        <Name m={m} size={size} split={split} lastClass={lastClass} />
      </div>
      {m.headline && (
        <p className={`pt-lede pt-rise mt-6 max-w-[36ch] text-(--pt-tagline) [overflow-wrap:anywhere] ${center ? "mx-auto" : ""}`} style={rise(3)}>
          {m.headline}
        </p>
      )}
      {stats !== "none" && m.stats.length > 0 && (
        <div className={`pt-rise mt-9 w-full ${center ? "max-w-xl" : "max-w-xl"}`} style={rise(4)}>
          <Stats stats={m.stats} variant={stats} className={center && stats !== "boxes" ? "justify-center" : ""} />
        </div>
      )}
      <div className={`pt-rise mt-9 flex flex-wrap items-center gap-x-7 gap-y-4 ${center ? "justify-center" : ""}`} style={rise(5)}>
        <BookButton accepting={m.accepting} preview={m.preview} variant={panel ? "inverse" : "solid"} />
        {m.hasContact && <ContactLink />}
      </div>
      {children}
    </div>
  );
}

/** The portrait with the shape-specific decoration behind it: rings, an outline, or an offset block. */
function Framed({ m, shape, d, offset = "br", className = "" }: { m: ProfileModel; shape: PhotoShape; d: ResolvedDesign; offset?: "br" | "bl"; className?: string }) {
  const { aspect, radius } = SHAPE_STYLE[shape];
  const behind = "pointer-events-none absolute";
  const shift = offset === "br" ? "translate-x-4 translate-y-4 sm:translate-x-6 sm:translate-y-6" : "-translate-x-4 translate-y-4 sm:-translate-x-6 sm:translate-y-6";
  void d;

  return (
    <div className={`relative isolate ${className}`}>
      {shape === "circle" && (
        <>
          <span aria-hidden className={`${behind} -inset-3.5 rounded-full border border-(--pt-accent) opacity-40`} />
          <span aria-hidden className={`${behind} -inset-8 rounded-full border border-(--pt-accent) opacity-20`} />
          <span aria-hidden className={`${behind} -inset-[3.25rem] rounded-full border border-(--pt-accent) opacity-10`} />
        </>
      )}
      {shape === "arch" && <span aria-hidden className={`${behind} -inset-3.5 border-[1.5px] border-(--pt-accent) opacity-55`} style={{ borderRadius: "50% 50% 22px 22px / 40% 40% 22px 22px" }} />}
      {shape === "oval" && <span aria-hidden className={`${behind} -inset-3 rounded-[50%] border border-(--pt-accent) opacity-50`} />}
      {(shape === "blob" || shape === "rounded") && <span aria-hidden className={`${behind} inset-0 -z-10 bg-(--pt-alt) ${shift}`} style={{ aspectRatio: aspect, borderRadius: radius }} />}
      {shape === "square" && <span aria-hidden className={`${behind} inset-0 -z-10 bg-(--pt-accent) ${shift}`} />}
      <Portrait m={m} shape={shape} className="shadow-[0_28px_50px_-30px_rgba(0,0,0,0.45)]" />
    </div>
  );
}

// ---- split: photo on one side, the introduction on the other ----

export function HeroSplit({ m, d }: HeroProps) {
  const flip = Boolean(d.spec.flip);
  return (
    <section className={`relative ${decoClass(d)}`}>
      <div className={`${WRAP} grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24 lg:py-28`}>
        <div className={`pt-rise mx-auto w-full max-w-[26rem] lg:max-w-none ${flip ? "lg:order-2" : ""}`}>
          <Framed m={m} shape={d.shape} d={d} offset={flip ? "bl" : "br"} className="mx-auto max-w-[26rem]" />
        </div>
        <Intro m={m} />
      </div>
    </section>
  );
}

// ---- center: everything on one axis ----

export function HeroCenter({ m, d }: HeroProps) {
  return (
    <section className={`relative overflow-hidden ${decoClass(d)}`}>
      <div className={`${WRAP} flex max-w-3xl flex-col items-center py-16 text-center sm:py-24`}>
        <div className="pt-rise mb-14 w-[min(58vw,15rem)] sm:mb-16 sm:w-60">
          <Framed m={m} shape={d.shape} d={d} offset="br" />
        </div>
        <Intro m={m} align="center" stats="chips" />
      </div>
    </section>
  );
}

// ---- band: a coloured strip with the portrait stepping over its edge ----

export function HeroBand({ m, d }: HeroProps) {
  return (
    <section>
      <div className="relative h-44 overflow-hidden bg-(--pt-alt) sm:h-64">
        <span aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-(--pt-bg) opacity-30 sm:size-[26rem]" />
        <span aria-hidden className="absolute -bottom-32 left-[18%] size-64 rounded-full bg-(--pt-bg) opacity-20" />
      </div>
      <div className={WRAP}>
        <div className="-mt-20 flex flex-col gap-8 sm:-mt-28 lg:flex-row lg:gap-14">
          <Portrait m={m} shape={d.shape} className="pt-rise w-40 shrink-0 self-start shadow-[0_0_0_8px_var(--pt-bg)] sm:w-52 lg:w-64" />
          <div className="pb-14 sm:pb-20 lg:pt-[8.5rem]">
            <Intro m={m} stats="row" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- masthead: the name set like a magazine cover ----

export function HeroMasthead({ m, d }: HeroProps) {
  return (
    <section className={`relative ${decoClass(d)}`}>
      <div className={`${WRAP} pt-8 pb-12 sm:pt-10 sm:pb-20`}>
        <div className="pt-label flex items-center justify-between gap-6 border-b border-(--pt-text) pb-3">
          <span className="min-w-0 [overflow-wrap:anywhere]">{m.title}</span>
          {m.location && <span className="hidden shrink-0 text-(--pt-muted) sm:block">{m.location}</span>}
        </div>

        <h1 className="pt-display pt-h1-xl pt-rise mt-6 sm:mt-8 [overflow-wrap:anywhere]">
          {m.firstNames}
          {m.lastName && (
            <>
              <br />
              {m.lastName}
            </>
          )}
          <span className="text-(--pt-accent)">.</span>
        </h1>

        <div className="mt-10 grid gap-10 border-t border-(--pt-text) pt-8 lg:grid-cols-12 lg:gap-14">
          <div className="pt-rise lg:col-span-4" style={rise(2)}>
            <Portrait m={m} shape={d.shape} className="w-full max-w-sm" />
          </div>
          <div className="lg:col-span-8">
            {m.headline && (
              <p className="pt-display pt-rise text-[calc(clamp(1.7rem,3.6vw,2.7rem)*var(--pt-ds))] leading-[1.15] text-balance [overflow-wrap:anywhere]" style={rise(3)}>
                {m.headline}
              </p>
            )}
            <div className="pt-rise mt-9 max-w-xl" style={rise(4)}>
              <Stats stats={m.stats} variant="row" />
            </div>
            <div className="pt-rise mt-9 flex flex-wrap items-center gap-x-7 gap-y-4" style={rise(5)}>
              <BookButton accepting={m.accepting} preview={m.preview} />
              {m.hasContact && <ContactLink />}
              {m.verified && <span className="pt-label text-(--pt-muted)">Verified practitioner</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- poster: half photograph, half colour ----

export function HeroPoster({ m, d }: HeroProps) {
  const flip = Boolean(d.spec.flip);
  return (
    <section className="grid min-h-[min(100svh,54rem)] lg:grid-cols-2">
      <div className={`relative min-h-[24rem] ${flip ? "lg:order-2" : ""}`}>
        <Bleed m={m} />
      </div>
      <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-16 xl:px-24" style={panelStyle(d)}>
        <Intro m={m} panel stats="plain" size="pt-h1" />
      </div>
    </section>
  );
}

// ---- card: a floating card on a coloured backdrop ----

function Geometric() {
  return (
    <>
      <span aria-hidden className="absolute -top-10 right-[6%] size-40 rounded-full bg-(--pt-accent) sm:size-56" />
      <span aria-hidden className="absolute top-24 right-[22%] size-24 bg-(--pt-text) sm:size-32" style={{ clipPath: "polygon(0 100%, 100% 100%, 50% 0)" }} />
      <span aria-hidden className="absolute bottom-16 left-[4%] size-28 rounded-t-full bg-(--pt-text) sm:size-40" />
      <span aria-hidden className="absolute bottom-24 left-[14%] hidden size-16 bg-(--pt-accent) sm:block" />
    </>
  );
}

export function HeroCard({ m, d }: HeroProps) {
  return (
    <div>
      <section className="relative overflow-hidden bg-(--pt-alt) pt-10 pb-16 sm:pt-20 sm:pb-24" style={{ color: "var(--pt-alt-foreground)" }}>
        {d.spec.ornament === "geometric" ? (
          <Geometric />
        ) : (
          <>
            <span aria-hidden className="absolute -top-32 -left-24 size-96 rounded-full bg-(--pt-bg) opacity-25" />
            <span aria-hidden className="absolute -right-20 -bottom-40 size-[28rem] rounded-full bg-(--pt-bg) opacity-20" />
          </>
        )}
        <div className="relative mx-auto max-w-5xl px-5 sm:px-8" style={{ color: "var(--pt-text)" }}>
          <div className="pt-rise grid items-center gap-9 rounded-[calc(var(--pt-r)+10px)] bg-(--pt-surface) p-6 shadow-[0_40px_70px_-40px_rgba(0,0,0,0.5)] sm:p-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-14">
            <Portrait m={m} shape={d.shape} className="mx-auto w-44 sm:w-56 md:w-64" />
            <Intro m={m} stats="none" />
          </div>
        </div>
      </section>
      {m.stats.length > 0 && (
        <div className="relative z-10 mx-auto -mt-9 max-w-5xl px-8 sm:px-14">
          <Stats stats={m.stats} variant="boxes" className="pt-rise" />
        </div>
      )}
    </div>
  );
}
