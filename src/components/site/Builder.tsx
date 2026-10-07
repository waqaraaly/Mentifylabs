"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MiniPreview, PagePreview, type PreviewState } from "@/components/site/PagePreview";
import { handleFromName } from "@/lib/handleFromName";
import { COLOR_THEMES, type ColorThemeId } from "@/lib/themes";
import type { SessionType } from "@/types/practitioner";

const AREAS = ["Anxiety", "Depression", "Burnout", "Relationships", "Trauma", "Grief", "ADHD", "OCD"];
const MODES: { value: SessionType; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "offline", label: "In person" },
  { value: "both", label: "Both" },
];
const PROMISES = [
  "What a client writes about why they're coming is private. It's never shown on your page.",
  "Your page stats count visits, not people, and a visit can't be traced to the next day's.",
  "Sign-in can ask for a code sent to your email.",
  "You decide when you're visible, and you can take your page offline whenever you need to.",
];

const underlineInput = "w-full border-0 border-b-2 border-(--ink) bg-transparent py-3 outline-none placeholder:text-(--quiet)/45 focus:border-(--leaf-deep)";

function StepShell({ n, active, children }: { n: number; active: boolean; children: React.ReactNode }) {
  return (
    <section data-step={n} data-active={active} className="site-step flex min-h-[70vh] flex-col justify-center py-14 lg:min-h-screen lg:py-20">
      <p className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.16em] text-(--quiet) uppercase">
        <span aria-hidden className="size-2 rounded-full bg-(--honey)" />
        0{n}
      </p>
      {children}
    </section>
  );
}

/**
 * The whole homepage: six steps down the left, and the visitor's own page, drawn by the real profile components, beside
 * them. What they type, pick and scroll to changes the page. Nothing is sent anywhere until they choose to sign up.
 */
export function Builder() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [areas, setAreas] = useState<string[]>(["Anxiety", "Burnout", "Relationships"]);
  const [mode, setMode] = useState<SessionType>("online");
  const [theme, setTheme] = useState<ColorThemeId>("sage");
  const [step, setStep] = useState(1);
  const column = useRef<HTMLDivElement>(null);

  // Whichever step is nearest the middle of the screen is the one the page is showing.
  useEffect(() => {
    const nodes = column.current?.querySelectorAll<HTMLElement>("[data-step]");
    if (!nodes) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setStep(Number((entry.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const slug = handleFromName(name);
  const state: PreviewState = { name, title, areas, mode, theme, slug, verified: step >= 5, overlay: step === 4 ? "times" : step === 5 ? "trust" : null };
  const toggleArea = (area: string) => setAreas((current) => (current.includes(area) ? current.filter((a) => a !== area) : current.length < 6 ? [...current, area] : current));
  const claim = name.trim() ? `/signup?name=${encodeURIComponent(name.trim().slice(0, 120))}` : "/signup";

  return (
    <div className="relative mx-auto max-w-7xl px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-10">
      {/* On a phone the page is a strip that stays at the top while the steps scroll beneath it. */}
      <div className="sticky top-0 z-30 -mx-6 shadow-[0_12px_24px_-18px_rgba(42,51,32,0.5)] lg:hidden">
        <MiniPreview {...state} />
      </div>

      <div ref={column} className="lg:col-start-1 lg:row-start-1">
        <StepShell n={1} active={step === 1}>
          <h1 className="site-display mt-6 text-[clamp(2.9rem,6.2vw,5.6rem)]">
            Your practice, on <span className="site-marker italic">one page.</span>
          </h1>
          <p className="mt-7 max-w-[36ch] text-[19px] leading-relaxed text-(--quiet)">Type your name and watch it appear. Make it yours before you decide anything.</p>
          <label htmlFor="builder-name" className="mt-12 text-sm font-medium text-(--quiet)">
            Your name
          </label>
          <input
            id="builder-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoComplete="off"
            placeholder="Dr. Ayesha Khan"
            className={`site-display mt-1 max-w-lg text-[clamp(1.9rem,3.4vw,3rem)] ${underlineInput}`}
          />
          <p className="mt-3 font-mono text-[13px] text-(--quiet)">
            mentifylabs.com/<span className="text-(--ink)">{slug || "your-name"}</span>
          </p>
        </StepShell>

        <StepShell n={2} active={step === 2}>
          <h2 className="site-display mt-6 text-[clamp(2.2rem,4.2vw,3.6rem)]">Say what you do.</h2>
          <label htmlFor="builder-title" className="mt-10 text-sm font-medium text-(--quiet)">
            Your professional title
          </label>
          <input id="builder-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} autoComplete="off" placeholder="Clinical Psychologist" className={`mt-1 max-w-lg text-2xl ${underlineInput}`} />

          <p className="mt-10 text-sm font-medium text-(--quiet)">What do you help with? Pick up to six.</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {AREAS.map((area) => {
              const on = areas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleArea(area)}
                  className={`rounded-full px-4 py-2 text-[15px] font-medium ring-1 transition duration-200 ${on ? "bg-(--leaf-deep) text-white ring-(--leaf-deep)" : "bg-white/60 text-(--ink) ring-(--hair) hover:ring-(--leaf)"}`}
                >
                  {area}
                </button>
              );
            })}
          </div>

          <p className="mt-10 text-sm font-medium text-(--quiet)">How do you see clients?</p>
          <div role="radiogroup" aria-label="How you see clients" className="mt-3 inline-flex rounded-full bg-white/60 p-1 ring-1 ring-(--hair)">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={mode === m.value}
                onClick={() => setMode(m.value)}
                className={`rounded-full px-5 py-2 text-[15px] font-medium transition duration-200 ${mode === m.value ? "bg-(--leaf-deep) text-white" : "text-(--ink) hover:text-(--leaf-deep)"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </StepShell>

        <StepShell n={3} active={step === 3}>
          <h2 className="site-display mt-6 text-[clamp(2.2rem,4.2vw,3.6rem)]">Make it feel like you.</h2>
          <p className="mt-6 max-w-[38ch] text-[18px] leading-relaxed text-(--quiet)">Seven palettes, all light and calm. Change it whenever you like.</p>
          <div role="radiogroup" aria-label="Colour theme" className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
            {COLOR_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={theme === t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-start gap-3 rounded-2xl bg-white/60 p-4 text-left ring-1 transition duration-200 hover:-translate-y-0.5 ${theme === t.id ? "ring-2 ring-(--leaf-deep)" : "ring-(--hair) hover:ring-(--leaf)"}`}
              >
                <span className="flex -space-x-1.5" aria-hidden>
                  {t.swatches.slice(1, 4).map((color) => (
                    <span key={color} className="size-6 rounded-full ring-2 ring-white" style={{ background: color }} />
                  ))}
                </span>
                <span className="text-[14px] leading-tight font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        </StepShell>

        <StepShell n={4} active={step === 4}>
          <h2 className="site-display mt-6 text-[clamp(2.2rem,4.2vw,3.6rem)]">Show when you&apos;re free.</h2>
          <p className="mt-6 max-w-[40ch] text-[18px] leading-relaxed text-(--quiet)">
            Your page lists your real open times. Someone picks one and asks for it. No account, no messages to trade. Online times show in each visitor&apos;s own time zone.
          </p>
          <p className="mt-6 text-sm text-(--quiet)">The times on the page are a sample.</p>
        </StepShell>

        <StepShell n={5} active={step === 5}>
          <h2 className="site-display mt-6 text-[clamp(2.2rem,4.2vw,3.6rem)]">Earn trust before anyone writes.</h2>
          <p className="mt-6 max-w-[40ch] text-[18px] leading-relaxed text-(--quiet)">
            Upload a license, a degree or a membership. Someone on our team reads it, and your page gets the badge beside your name. Every profile is reviewed by a person before it goes live.
          </p>
        </StepShell>

        <StepShell n={6} active={step === 6}>
          <h2 className="site-display mt-6 text-[clamp(2.6rem,5.4vw,4.8rem)]">
            It&apos;s <span className="italic">yours.</span>
          </h2>
          <p className="mt-8 font-mono text-[clamp(1.05rem,2vw,1.5rem)] break-all text-(--ink)">
            mentifylabs.com/<span className="font-semibold">{slug || "your-name"}</span>
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
            <Link
              href={claim}
              className="group inline-flex items-center gap-3 rounded-full bg-(--leaf-deep) px-8 py-4 text-[16px] font-semibold text-white shadow-[0_18px_32px_-18px_rgba(61,80,45,0.95)] transition duration-200 hover:-translate-y-0.5 hover:bg-(--moss)"
            >
              Make this my page
              <svg aria-hidden viewBox="0 0 20 20" className="size-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </Link>
            <Link href="/login" className="text-[15px] font-semibold underline decoration-(--hair) decoration-2 underline-offset-[6px] transition hover:decoration-(--honey)">
              I already have an account
            </Link>
          </div>
          <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-(--quiet)">You choose your final link when you set up, and setup takes a few short steps. You can finish your profile later.</p>

          <ul className="mt-14 max-w-xl space-y-4 border-t border-(--hair) pt-8">
            {PROMISES.map((line) => (
              <li key={line} className="flex items-start gap-3.5 text-[15px] leading-snug text-(--quiet)">
                <span aria-hidden className="mt-[7px] size-2 shrink-0 rounded-full bg-(--honey)" />
                {line}
              </li>
            ))}
          </ul>
        </StepShell>
      </div>

      <aside className="hidden lg:col-start-2 lg:row-start-1 lg:block">
        <div className="sticky top-6 flex h-[calc(100vh-3rem)] max-h-[860px] flex-col py-2">
          <div className="min-h-0 flex-1">
            <PagePreview {...state} />
          </div>
          <p className="mt-3 shrink-0 text-center text-[12px] text-(--quiet)">Your name, title, areas and colours are yours. The rest is sample text.</p>
        </div>
      </aside>
    </div>
  );
}
