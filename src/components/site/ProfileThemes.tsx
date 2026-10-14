"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COLOR_THEMES, type ColorThemeId } from "@/lib/themes";

// Six of the app's real colour themes, in the order they are shown.
const THEME_IDS: ColorThemeId[] = ["moss-honey", "ocean-mist", "ink-blue", "golden-hour", "eucalyptus", "soft-sky"];
const THEMES = THEME_IDS.map((id) => COLOR_THEMES.find((t) => t.id === id)).filter((t): t is (typeof COLOR_THEMES)[number] => Boolean(t));

const INTERVAL = 3800;
const SOFT = "rounded-[10px] shadow-[inset_0_0_0_1px_var(--pt-border)] transition-shadow duration-500";

/**
 * "Create a profile that looks like you": a sample public profile beside a row of the app's real colour themes. Picking a
 * theme recolours the profile at once; until a visitor picks one it steps through them on its own, and with reduced motion
 * it stays on the first. The card is an illustration, so it is hidden from screen readers; the theme buttons are not.
 */
export function ProfileThemes() {
  const [current, setCurrent] = useState(0);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % THEMES.length), INTERVAL);
    return () => clearInterval(timer);
  }, [touched]);

  const theme = THEMES[current];

  return (
    <section id="profile" className="scroll-mt-20 bg-white py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-20 lg:px-10">
        <div>
          <p className="text-sm font-semibold tracking-[0.02em] text-(--leaf-deep)">Your profile</p>
          <h2 className="mt-3.5 max-w-[14ch] text-[clamp(2.2rem,4.2vw,3.4rem)] leading-[1.06] font-semibold tracking-[-0.04em] text-balance text-(--ink)">
            Create a profile that looks like you.
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-(--quiet)">
            Choose your colours, tell your story, and add your areas of expertise, your services and your open times. Everything a client wants to know is on one page.
          </p>

          <div className="mt-9">
            <p className="text-[13px] font-semibold text-(--quiet)">Colour theme</p>
            <div className="mt-3 flex flex-wrap gap-2.5" role="group" aria-label="Colour theme">
              {THEMES.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={i === current}
                  onClick={() => {
                    setTouched(true);
                    setCurrent(i);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl bg-white py-2 pr-3.5 pl-2.5 text-sm font-medium transition ${
                    i === current ? "shadow-[inset_0_0_0_2px_var(--ink)]" : "shadow-[inset_0_0_0_1px_var(--hair)] hover:shadow-[inset_0_0_0_1px_var(--quiet)]"
                  }`}
                >
                  <span
                    className="size-[22px] rounded-full shadow-[0_0_0_1px_rgba(31,38,23,0.12)]"
                    style={{ background: `linear-gradient(135deg, ${t.swatches[1] ?? t.swatches[0]} 50%, ${t.swatches[2] ?? t.swatches[0]} 50%)` }}
                  />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <Link href="/signup" className="mt-8 inline-flex rounded-full bg-(--ink) px-6 py-3.5 text-[15px] font-medium text-white transition hover:bg-(--moss)">
            Create your profile
          </Link>
        </div>

        <div className="grid place-items-center rounded-3xl bg-[#f6f5ee] px-6 py-10">
          <div
            aria-hidden
            data-pt-theme={theme.id}
            className="w-full max-w-[400px] rounded-[26px] bg-(--pt-outer) p-2 text-left transition-colors duration-500"
          >
            <div className="rounded-[19px] bg-(--pt-bg) p-[22px] text-sm text-(--pt-text) transition-colors duration-500 [font-family:var(--font-inter),Arial,Helvetica,sans-serif]">
              <div className="flex items-center gap-3.5">
                <div
                  className="grid h-[68px] w-[62px] shrink-0 place-items-center border-4 border-(--pt-ring,var(--pt-outer)) bg-white text-[19px] font-semibold text-(--pt-accent) transition-colors duration-500"
                  style={{ borderRadius: "60% 40% 30% 70% / 55% 45% 65% 35%" }}
                >
                  SM
                </div>
                <div>
                  <p className="flex items-center gap-[7px] text-xl font-semibold tracking-[-0.02em]">
                    Dr. Sara Malik
                    <svg viewBox="0 0 24 24" className="size-[17px] shrink-0">
                      <circle cx="12" cy="12" r="10" fill="var(--pt-accent)" />
                      <path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="var(--pt-accent-foreground)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </p>
                  <p className="mt-0.5 text-[13px] text-(--pt-muted)">Counselling psychologist · Lahore</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2.5 rounded-full bg-white py-[5px] pr-[5px] pl-4 text-[12.5px] text-(--pt-muted) shadow-[0_10px_22px_-16px_rgba(32,34,31,0.4)]">
                <span>Next · Wed, 5:00 PM</span>
                <b className="rounded-full bg-(--pt-accent) px-3.5 py-2 font-semibold whitespace-nowrap text-(--pt-accent-foreground) transition-colors duration-500">Book a Session</b>
              </div>

              <Heading>About</Heading>
              <p className="leading-relaxed opacity-85">I help young adults find steadier ground with stress, self-esteem and the big transitions of their twenties.</p>

              <Heading>Areas of expertise</Heading>
              <div className="grid gap-1.5">
                {["Anxiety", "Self-esteem", "Academic stress"].map((a) => (
                  <span key={a} className={`flex items-center gap-2.5 px-3 py-[9px] ${SOFT}`}>
                    <i className="size-[7px] shrink-0 rounded-full bg-(--pt-accent) transition-colors duration-500" />
                    {a}
                  </span>
                ))}
              </div>

              <Heading>Services</Heading>
              <div className="grid gap-1.5">
                {["First consultation", "Individual sessions"].map((s) => (
                  <span key={s} className={`flex justify-between bg-white px-3 py-[9px] ${SOFT}`}>
                    {s}
                    <span className="text-(--pt-accent) transition-colors duration-500">→</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <h4 className="mt-5 mb-2 inline-block bg-[linear-gradient(transparent_58%,var(--pt-marker,color-mix(in_srgb,var(--pt-accent)_28%,transparent))_58%,var(--pt-marker,color-mix(in_srgb,var(--pt-accent)_28%,transparent))_92%,transparent_92%)] px-[0.1em] text-sm font-bold">
      {children}
    </h4>
  );
}
