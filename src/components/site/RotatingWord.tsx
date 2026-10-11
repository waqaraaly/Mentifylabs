"use client";

import { useEffect, useState } from "react";

/**
 * A word that changes every couple of seconds, sliding up and out as the next slides up and in. All the words share one
 * grid cell, so the box is as wide as the longest and the headline never jumps. For a visitor who prefers less motion it
 * stays on the first word. Screen readers are given the full list by the caller, so this is hidden from them.
 */
export function RotatingWord({ words, interval = 2600 }: { words: string[]; interval?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setCurrent((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span aria-hidden className="inline-grid overflow-hidden py-[0.08em] align-top leading-[1.12]">
      {words.map((word, i) => {
        // Where this word is in the cycle: 0 is showing, the one just before is leaving upward, the rest wait below.
        const position = (i - current + words.length) % words.length;
        const state = position === 0 ? "translate-y-0 opacity-100" : position === words.length - 1 ? "-translate-y-[70%] opacity-0" : "translate-y-[70%] opacity-0";
        return (
          <span key={word} className={`col-start-1 row-start-1 transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none ${state}`}>
            <span className="inline-block bg-[linear-gradient(transparent_62%,var(--glow)_62%,var(--glow)_90%,transparent_90%)] px-[0.08em]">{word}</span>
          </span>
        );
      })}
    </span>
  );
}
