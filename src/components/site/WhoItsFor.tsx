"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotatingWord } from "@/components/site/RotatingWord";

// The roles the headline cycles through, each with a sample personal link. The names are examples.
const ROLES = [
  { word: "psychiatrist", title: "Psychiatrists", handle: "imran-qureshi" },
  { word: "psychologist", title: "Psychologists", handle: "sara-malik" },
  { word: "therapist", title: "Therapists", handle: "ayesha-khan" },
  { word: "counsellor", title: "Counsellors", handle: "bilal-ahmed" },
  { word: "psychotherapist", title: "Psychotherapists", handle: "hina-farooq" },
];

const INTERVAL = 3200;

/**
 * The name part of the big link, typed like the personal-link picture in "In action": when the role changes it erases the old
 * name and types the new one. With reduced motion the new name simply replaces the old.
 */
function TypedHandle({ target }: { target: string }) {
  const [text, setText] = useState(target);
  const shown = useRef(target);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const now = setTimeout(() => {
        shown.current = target;
        setText(target);
      }, 0);
      return () => clearTimeout(now);
    }
    let erasing = true;
    const timer = setInterval(() => {
      const cur = shown.current;
      if (erasing) {
        if (target.startsWith(cur)) erasing = false;
        else {
          shown.current = cur.slice(0, -1);
          setText(shown.current);
          return;
        }
      }
      if (cur.length < target.length) {
        shown.current = target.slice(0, cur.length + 1);
        setText(shown.current);
      } else {
        clearInterval(timer);
      }
    }, 34);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <b aria-hidden className="font-semibold text-(--ink)">
      {text}
    </b>
  );
}

/**
 * Introduces who the platform is for. The headline names one role at a time, and beneath it a sample personal link for
 * that role appears in large type (mentifylabs.com/hina-farooq), typed with a cursor and changing with the role. Dots let a visitor step through
 * the roles; the cycle carries on from there.
 */
export function WhoItsFor() {
  const [current, setCurrent] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => setCurrent((i) => (i + 1) % ROLES.length), INTERVAL);
  }, []);

  useEffect(() => {
    start();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [start]);

  const role = ROLES[current];

  return (
    <section id="who" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-medium text-(--leaf-deep)">Who it is for</p>
          <h2 className="mx-auto mt-3 max-w-4xl text-[clamp(2rem,4.6vw,3.7rem)] leading-[1.06] font-semibold tracking-[-0.04em] text-balance text-(--ink)">
            <span className="sr-only">One link for every psychiatrist, psychologist, therapist, counsellor and psychotherapist.</span>
            <span aria-hidden>
              One link for every
              <br />
              <RotatingWord words={ROLES.map((r) => r.word)} index={current} />
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-(--quiet)">
            Everyone who works in mental health gets a personal link of their own, with a page behind it that shows who they are and when they are free.
          </p>
        </div>

        {/* the current role's sample link in the same rounded card as the "In action" personal link, large and typed */}
        <div aria-hidden className="mx-auto mt-14 grid min-h-[170px] max-w-6xl place-items-center text-center">
          <div className="flex w-full max-w-[17.6em] items-center gap-[0.55em] rounded-full bg-white py-[0.55em] pr-[0.5em] pl-[0.95em] text-[clamp(1.1rem,3.6vw,2.6rem)] ring-1 ring-(--hair) shadow-[0_24px_48px_-32px_rgba(31,38,23,0.35)]">
            <span className="size-[0.42em] shrink-0 rounded-full bg-(--glow)" />
            <p className="min-w-0 flex-1 truncate text-left tracking-[-0.01em] text-(--quiet)">
              mentifylabs.com/
              <TypedHandle target={role.handle} />
              <span className="ml-[0.06em] inline-block h-[1.05em] w-[0.06em] bg-(--honey) align-[-0.15em] motion-safe:animate-pulse" />
            </p>
            <span className="shrink-0 rounded-full bg-(--ink) px-[0.8em] py-[0.4em] text-[0.4em] font-medium text-white">Copy</span>
          </div>
        </div>

        <div className="mt-7 flex justify-center gap-2" role="group" aria-label="Choose a role">
          {ROLES.map((r, i) => (
            <button
              key={r.word}
              type="button"
              aria-label={r.title}
              aria-pressed={i === current}
              onClick={() => {
                setCurrent(i);
                start();
              }}
              className="h-[9px] rounded-full transition-[width,background-color] duration-300"
              style={{ width: i === current ? 28 : 9, background: i === current ? "var(--ink)" : "#dcd8cd" }}
            />
          ))}
        </div>

        {/* the same information for screen readers, as a plain list */}
        <ul className="sr-only">
          {ROLES.map((r) => (
            <li key={r.word}>
              {r.title}: for example mentifylabs.com/{r.handle}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
