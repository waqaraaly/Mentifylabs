"use client";

import { useState } from "react";
import type { Practitioner } from "@/types/practitioner";
import { WavyUnderline } from "@/components/ui/WavyUnderline";
import { ArrowScroller } from "@/components/ui/ArrowScroller";

type Entry = { title: string; subtitle: string; years: string; startYear: number };

function parseEntry(raw: string): Entry {
  const [title = "", subtitle = "", years = ""] = raw.split(",").map((part) => part.trim());
  const startYear = Number(years.match(/\d{4}/)?.[0] ?? 0);
  return { title, subtitle, years, startYear };
}

// Oldest first, most recent/advanced last — so the timeline below reads
// left-to-right as forward progress, ending on current standing.
function chronological(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => a.startYear - b.startYear);
}

// Column gap as a PERCENT (not px) so it scales with the container instead
// of drifting at different widths — this is what lets the dots below use
// pure arithmetic to land exactly on each column's left edge instead of
// needing to measure the DOM.
const GAP_PCT = 8;

// The timeline's dot for entry i must sit at the same x as the text column
// for entry i. This computes the left edge of flex column i out of the same
// n/gap numbers the text row below is laid out with (equal flex-1 columns,
// GAP_PCT gap), so a dot is always exactly above the start of its own
// entry's text, for any number of entries.
function columnLeftEdges(n: number): number[] {
  if (n <= 1) return [0];
  const columnWidth = (100 - (n - 1) * GAP_PCT) / n;
  return Array.from({ length: n }, (_, i) => i * (columnWidth + GAP_PCT));
}

function EntryText({ entry }: { entry: Entry }) {
  return (
    <div className="[overflow-wrap:anywhere]">
      {entry.years && <p className="text-base tracking-[0.02em] text-(--pt-accent) sm:text-lg">{entry.years}</p>}
      <p className="mt-2 text-lg leading-snug text-(--pt-text) sm:text-xl">{entry.title}</p>
      {entry.subtitle && <p className="mt-1.5 text-base text-(--pt-muted) sm:text-lg">{entry.subtitle}</p>}
    </div>
  );
}

// A single entry has nothing to draw a timeline between, so it gets its own
// milestone layout instead of one lonely dot stranded on an empty line.
function SingleMilestone({ entry }: { entry: Entry }) {
  return (
    <div className="flex items-start gap-5 rounded-2xl bg-(--pt-tint2) p-6">
      <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-white">
        <span className="size-3 rounded-full bg-(--pt-accent)" aria-hidden />
      </span>
      <EntryText entry={entry} />
    </div>
  );
}

// A straight horizontal timeline: one line, one dot per entry, each dot
// directly above the start of its own entry's text below. Entries arrive
// chronological (oldest first), so the last one is both rightmost and the
// most recent — its dot is filled solid to read as "current standing."
function StraightTimeline({ entries }: { entries: Entry[] }) {
  const columnXs = columnLeftEdges(entries.length);
  const minWidth = entries.length * 210;
  const lastIndex = entries.length - 1;

  return (
    <ArrowScroller>
      {/* Side padding keeps the first/last dot's own circle (offset by
          -translate-x-1/2) from being cut off by the scroll container.
          The line row must be at least as tall as the largest dot (the
          filled "latest" one, size-4/16px) — overflow-x-auto implicitly
          makes overflow-y auto too, so a shorter row would get its dots
          clipped top and bottom instead of just sitting on the line. */}
      <div className="px-2" style={{ minWidth }}>
        <div className="relative h-5">
          <div
            className="absolute top-1/2 h-px -translate-y-1/2 bg-(--pt-border)"
            style={{ left: `${columnXs[0]}%`, right: `${100 - columnXs[lastIndex]}%` }}
            aria-hidden
          />
          {columnXs.map((x, i) => (
            <span
              key={i}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-(--pt-accent) ${
                i === lastIndex ? "size-4 bg-(--pt-accent)" : "size-[13px] bg-white"
              }`}
              style={{ left: `${x}%` }}
              aria-hidden
            />
          ))}
        </div>

        <div className="mt-8 flex" style={{ gap: `${GAP_PCT}%` }}>
          {entries.map((entry) => (
            <div key={`${entry.title}-${entry.years}`} className="min-w-0 flex-1">
              <EntryText entry={entry} />
            </div>
          ))}
        </div>
      </div>
    </ArrowScroller>
  );
}

function Timeline({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-(--pt-muted)">Nothing to show yet.</p>;
  }
  if (entries.length === 1) {
    return <SingleMilestone entry={entries[0]} />;
  }
  return <StraightTimeline entries={entries} />;
}

export function ProfessionalJourney({ practitioner }: { practitioner: Practitioner }) {
  const education = chronological(practitioner.education.map(parseEntry));
  const experience = chronological((practitioner.workExperience ?? []).map(parseEntry));
  const hasExperience = experience.length > 0;
  const [tab, setTab] = useState<"education" | "experience">("education");

  if (education.length === 0 && experience.length === 0) return null;

  return (
    <section className="mt-24 sm:mt-32">
      <h2 className="relative inline-block text-[28px] font-medium text-(--pt-text) sm:text-[38px]">
        Professional Journey
        <WavyUnderline className="absolute inset-x-0 -bottom-3.5 h-3 w-full" />
      </h2>

      <div className="relative mx-auto mt-11 flex w-fit rounded-xl border border-(--pt-toggle-border) bg-(--pt-toggle-track) p-[5px]">
        <span
          className="absolute top-[5px] bottom-[5px] w-[calc(50%-5px)] rounded-lg bg-(--pt-accent) transition-all duration-300"
          style={{ left: tab === "education" ? "5px" : "50%" }}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => setTab("education")}
          className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
            tab === "education" ? "text-(--pt-accent-foreground)" : "text-(--pt-muted)"
          }`}
        >
          Education
        </button>
        {hasExperience && (
          <button
            type="button"
            onClick={() => setTab("experience")}
            className={`relative z-10 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
              tab === "experience" ? "text-(--pt-accent-foreground)" : "text-(--pt-muted)"
            }`}
          >
            Experience
          </button>
        )}
      </div>

      <div className="mt-10">
        <Timeline entries={tab === "education" ? education : experience} />
      </div>
    </section>
  );
}
