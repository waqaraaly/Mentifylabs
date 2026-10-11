import Link from "next/link";
import { RotatingWord } from "@/components/site/RotatingWord";

type Sample = { name: string; initials: string; title: string; areas: string[]; open: string; bg: string; tint: string; accent: string };

// Sample profiles, shown for illustration. The palettes follow the light colour themes a practitioner can choose.
const SAMPLES: Sample[] = [
  { name: "Dr. Ayesha Khan", initials: "AK", title: "Clinical Psychologist", areas: ["Anxiety", "Burnout"], open: "Tue 10:00", bg: "#f6f4ea", tint: "#e3e9d3", accent: "#66794f" },
  { name: "Dr. Daniel Okafor", initials: "DO", title: "Psychiatrist", areas: ["Depression", "ADHD"], open: "Wed 15:30", bg: "#f3f7fb", tint: "#dbe8f3", accent: "#2f4c6b" },
  { name: "Maya Lindqvist", initials: "ML", title: "Counsellor", areas: ["Grief", "Relationships"], open: "Thu 09:00", bg: "#fff8e1", tint: "#ffe9a8", accent: "#8a5c00" },
  { name: "Dr. Priya Raman", initials: "PR", title: "Child Psychologist", areas: ["Anxiety", "ADHD"], open: "Mon 16:00", bg: "#f1f9fb", tint: "#cfe8ee", accent: "#1e7a8c" },
  { name: "Tomás Herrera", initials: "TH", title: "Psychotherapist", areas: ["Trauma", "OCD"], open: "Fri 11:00", bg: "#faf3ec", tint: "#f0dccb", accent: "#8a5a3c" },
  { name: "Hana Suzuki", initials: "HS", title: "Family Therapist", areas: ["Relationships", "Burnout"], open: "Tue 18:00", bg: "#f3f8f5", tint: "#dde8d3", accent: "#37755f" },
];

const ROLES = ["psychiatrist", "psychologist", "therapist", "counsellor", "psychotherapist"];

const ROW_ONE = SAMPLES;
const ROW_TWO = [SAMPLES[3], SAMPLES[4], SAMPLES[5], SAMPLES[0], SAMPLES[1], SAMPLES[2]];

function ProfileCard({ s }: { s: Sample }) {
  return (
    <div className="w-[270px] shrink-0 rounded-3xl p-5 shadow-[0_20px_36px_-26px_rgba(31,38,23,0.5)] ring-1 ring-black/[0.07]" style={{ background: s.bg }}>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ background: s.tint, color: s.accent }}>
          {s.initials}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold tracking-[-0.01em]">
            {s.name}
            <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0" style={{ color: s.accent }}>
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="m7.5 12.5 3 3 6-6.5" />
            </svg>
          </p>
          <p className="truncate text-[13px] text-(--quiet)">{s.title}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {s.areas.map((area) => (
          <span key={area} className="rounded-full px-2.5 py-1 text-xs" style={{ background: s.tint }}>
            {area}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-black/[0.07] pt-3.5 text-[13px]">
        <span className="text-(--quiet)">Next open</span>
        <span className="flex items-center gap-1.5 font-medium tabular-nums">
          <span aria-hidden className="size-2 rounded-full bg-(--honey)" />
          {s.open}
        </span>
      </div>
    </div>
  );
}

function Row({ items, reverse }: { items: Sample[]; reverse?: boolean }) {
  return (
    <div className={`marquee ${reverse ? "marquee-reverse" : ""}`}>
      <div className="marquee-track">
        {items.map((s) => (
          <ProfileCard key={s.name} s={s} />
        ))}
        {/* A second copy makes the loop seamless. Hidden from screen readers so each profile is read once. */}
        <div aria-hidden className="contents">
          {items.map((s) => (
            <ProfileCard key={`copy-${s.name}`} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Introduces who the platform is for, with a drifting wall of sample profiles. */
export function WhoItsFor() {
  return (
    <section id="who" className="scroll-mt-20 overflow-hidden py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 text-center lg:px-10">
        <p className="text-sm font-medium text-(--leaf-deep)">Who it is for</p>
        <h2 className="mx-auto mt-3 max-w-4xl text-[clamp(2rem,4.6vw,3.7rem)] leading-[1.06] font-semibold tracking-[-0.04em] text-balance text-(--ink)">
          <span className="sr-only">One link for every psychiatrist, psychologist, therapist, counsellor and psychotherapist.</span>
          <span aria-hidden>
            One link for every
            <br />
            <RotatingWord words={ROLES} />
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-(--quiet)">
          A MentifyLabs page lets anyone who works in mental health show who they are, what they help with and when they are free.
        </p>
      </div>

      <div className="mt-14 grid gap-4">
        <Row items={ROW_ONE} />
        <Row items={ROW_TWO} reverse />
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-7xl flex-col items-center gap-5 px-6 text-center lg:px-10">
        <p className="max-w-xl text-[15px] leading-relaxed text-(--quiet)">
          These are sample profiles, shown for illustration. Every real profile is reviewed by a person before it goes live.
        </p>
        <Link href="/signup" className="rounded-full bg-(--ink) px-7 py-3.5 text-[15px] font-medium text-white transition hover:bg-(--moss)">
          Create your page
        </Link>
      </div>
    </section>
  );
}
