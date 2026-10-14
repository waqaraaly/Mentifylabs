"use client";

import { useEffect, useState } from "react";

/**
 * A word that changes every few seconds. The old word lifts away and fades, the new one rises in from below, then the
 * highlighter draws underneath it. All the words share one grid cell, so the box is as wide as the longest and the
 * headline never jumps. The clipping window has room above and below so ascenders and descenders (the "p" in
 * "therapist") are never cut. A visitor who prefers less motion sees the first word only. Screen readers get the full
 * list from the caller, so this is hidden from them.
 */
export function RotatingWord({
  words,
  interval = 2800,
  onChange,
  index,
}: {
  words: string[];
  interval?: number;
  onChange?: (index: number) => void;
  /** When given, the caller decides which word shows and this runs no timer of its own. */
  index?: number;
}) {
  const [own, setCurrent] = useState(0);
  const current = index ?? own;

  useEffect(() => {
    if (index !== undefined) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % words.length;
      setCurrent(i);
      onChange?.(i);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval, onChange, index]);

  return (
    <span aria-hidden className="inline-grid [clip-path:inset(-0.1em_-0.2em_-0.3em_-0.2em)] align-top">
      {words.map((word, i) => {
        // 0 is showing, the one just before is leaving upward, the rest wait below.
        const position = (i - current + words.length) % words.length;
        const showing = position === 0;
        const leaving = position === words.length - 1;
        return (
          <span
            key={word}
            className="col-start-1 row-start-1 transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
            style={{
              transform: showing ? "translateY(0)" : leaving ? "translateY(-55%)" : "translateY(55%)",
              opacity: showing ? 1 : 0,
              filter: showing ? "blur(0)" : "blur(4px)",
              // the old word clears out fast; the new one waits a beat, so the two never sit on top of each other
              transitionDuration: showing ? "650ms" : "260ms",
              transitionDelay: showing ? "180ms" : "0ms",
            }}
          >
            <span
              className="inline-block bg-[linear-gradient(transparent_64%,var(--marker)_64%,var(--marker)_88%,transparent_88%)] bg-no-repeat px-[0.06em] pb-[0.08em] transition-[background-size] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
              style={{ backgroundSize: showing ? "100% 100%" : "0% 100%", transitionDelay: showing ? "350ms" : "0ms" }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </span>
  );
}
