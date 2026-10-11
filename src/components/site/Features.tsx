"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { COLOR_THEMES } from "@/lib/themes";

function Check() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 text-(--leaf)">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="m7.5 12.5 3 3 6-6.5" />
    </svg>
  );
}

const card = "rounded-2xl bg-white ring-1 ring-(--hair)";

function LinkArt() {
  return (
    <div>
      <div className="flex items-center gap-3 rounded-full bg-white py-2.5 pr-2.5 pl-5 shadow-[0_18px_34px_-22px_rgba(31,38,23,0.45)] ring-1 ring-(--sage-edge)">
        <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-(--honey)" />
        <p className="min-w-0 flex-1 truncate font-mono text-[13px] text-(--quiet)">
          mentifylabs.com/<span className="font-semibold text-(--ink)">dr-ayesha-khan</span>
        </p>
        <span className="shrink-0 rounded-full bg-(--ink) px-3.5 py-2 text-[12.5px] font-medium text-white">Copy link</span>
      </div>
      <p className="mt-3 text-center text-xs text-(--quiet)">An example address. You choose yours when you set up.</p>
    </div>
  );
}

function TimesArt() {
  const slots = ["Tue 10:00", "Tue 14:30", "Thu 09:00", "Fri 16:00"];
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot, i) => (
          <span key={slot} className={`rounded-[10px] px-2 py-2.5 text-center text-[13px] tabular-nums ${i === 0 ? "bg-(--ink) text-white" : "bg-white ring-1 ring-(--hair)"}`}>
            {slot}
          </span>
        ))}
      </div>
      <p className="mt-2.5 text-center text-xs text-(--quiet)">Shown in the visitor&apos;s time zone</p>
    </div>
  );
}

function VerifiedArt() {
  return (
    <div className={`${card} flex items-center gap-3 px-4 py-3.5`}>
      <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-(--sage) text-sm font-semibold text-(--moss)">AK</span>
      <div>
        <p className="flex items-center gap-1.5 text-[15px] font-semibold">
          Dr. Ayesha Khan <Check />
        </p>
        <p className="text-[12.5px] text-(--quiet)">Clinical Psychologist</p>
      </div>
    </div>
  );
}

function RequestArt() {
  return (
    <div className={`${card} grid gap-2.5 px-4 py-3.5`}>
      <div className="flex h-[34px] items-center rounded-[9px] bg-[#f3f5ea] px-3 text-[13px] text-(--quiet)">Tue 10:00</div>
      <div className="flex h-[34px] items-center rounded-[9px] bg-[#f3f5ea] px-3 text-[13px] text-(--quiet)">
        Why I&apos;m reaching out
        <span className="ml-auto rounded-md bg-[#fbeccb] px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wider text-(--honey-text) uppercase">Private</span>
      </div>
      <div className="rounded-full bg-(--ink) py-2.5 text-center text-[13px] font-medium text-white">Send request</div>
    </div>
  );
}

function ThemesArt() {
  // Six themes spread across the list, so the row shows a range of colours rather than one family.
  const step = Math.max(1, Math.floor(COLOR_THEMES.length / 6));
  const colors = COLOR_THEMES.filter((_, i) => i % step === 0)
    .slice(0, 6)
    .map((t) => t.swatches[2] ?? t.swatches[0]);
  return (
    <div className="flex justify-center" aria-hidden>
      {colors.map((color, i) => (
        <span key={i} className="-ml-2.5 size-10 rounded-full ring-[3px] ring-white first:ml-0" style={{ background: color }} />
      ))}
    </div>
  );
}

function CodeArt() {
  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {["4", "8", "2", "9", "", ""].map((digit, i) => (
        <span key={i} className={`flex h-[46px] w-9 items-center justify-center rounded-[10px] text-lg font-semibold tabular-nums ${digit ? "bg-white ring-1 ring-(--hair)" : "bg-[#f3f5ea]"}`}>
          {digit}
        </span>
      ))}
    </div>
  );
}

function VisibilityArt() {
  return (
    <div className={`${card} flex items-center justify-between gap-4 px-4 py-3.5`}>
      <p className="text-[15px] font-medium">
        Page visible
        <span className="block text-[12.5px] font-normal text-(--quiet)">Anyone with your link can see it</span>
      </p>
      <span aria-hidden className="relative h-[26px] w-11 shrink-0 rounded-full bg-(--leaf)">
        <span className="absolute top-[3px] right-[3px] size-5 rounded-full bg-white" />
      </span>
    </div>
  );
}

const FEATURES: { title: string; body: string; art: ReactNode }[] = [
  {
    title: "Your personal link",
    body: "One address for your whole practice. Put it in your email signature or your bio, and clients land on your work, your approach and your open times in one place.",
    art: <LinkArt />,
  },
  {
    title: "Real open times",
    body: "List when you are free. Online times show in each visitor's own time zone, so nobody has to work out the difference.",
    art: <TimesArt />,
  },
  {
    title: "Verified by a person",
    body: "Upload a license, degree or membership. Someone on our team reads it, and your page earns a badge beside your name.",
    art: <VerifiedArt />,
  },
  {
    title: "Requests, no accounts",
    body: "Clients pick a time and send a request. They never have to sign up, and what they write stays private.",
    art: <RequestArt />,
  },
  {
    title: "Make it look like you",
    body: `Choose from ${COLOR_THEMES.length} light, calm colour themes and see the change as you pick.`,
    art: <ThemesArt />,
  },
  {
    title: "Two-step sign-in",
    body: "Turn on a code sent to your email each time you sign in, to keep your account and your clients' requests safe.",
    art: <CodeArt />,
  },
  {
    title: "You control visibility",
    body: "Choose when your page is visible and take it offline whenever you need to. Page stats count visits, not people.",
    art: <VisibilityArt />,
  },
];

/** What the app does: a list of features beside one large preview. The personal link opens first. */
export function Features() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = e.key === "ArrowDown" ? index + 1 : e.key === "ArrowUp" ? index - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const target = (next + FEATURES.length) % FEATURES.length;
    setActive(target);
    tabs.current[target]?.focus();
  };

  return (
    <section id="features" className="mx-auto scroll-mt-20 w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
      <p className="text-sm font-medium text-(--leaf-deep)">Features</p>
      <h2 className="mt-3 max-w-xl text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance text-(--ink)">
        Everything your practice needs on one page.
      </h2>

      <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        <div role="tablist" aria-label="Features" aria-orientation="vertical" className="grid content-start gap-1.5">
          {FEATURES.map((f, i) => {
            const selected = i === active;
            return (
              <button
                key={f.title}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                id={`feature-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="feature-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`grid gap-0.5 rounded-2xl px-4 py-3.5 text-left transition ${selected ? "bg-(--sage) ring-1 ring-(--sage-edge)" : "hover:bg-[#f5f6ee]"}`}
              >
                <span className={`font-semibold tracking-[-0.01em] ${i === 0 ? "text-lg" : "text-base"}`}>{f.title}</span>
                {selected && <span className="text-[15px] leading-relaxed text-(--quiet)">{f.body}</span>}
              </button>
            );
          })}
        </div>

        <div
          id="feature-panel"
          role="tabpanel"
          aria-labelledby={`feature-tab-${active}`}
          className="grid min-h-72 grid-cols-[minmax(0,1fr)] place-items-center rounded-3xl bg-(--sage) p-6 ring-1 ring-(--sage-edge) sm:p-10 lg:min-h-96"
        >
          <div className="w-full max-w-sm">{FEATURES[active].art}</div>
        </div>
      </div>
    </section>
  );
}
