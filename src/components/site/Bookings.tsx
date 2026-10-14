"use client";

import { useEffect, useState } from "react";

const STEPS = [
  {
    label: "Add your open times",
    body: "Set a weekly pattern or add single dates, online or in person. Your page shows them straight away.",
  },
  {
    label: "Review requests",
    body: "A client picks one of your times and sends a request, with no account to make. You see who is asking and for when.",
  },
  {
    label: "Get booked",
    body: "Accept, and the time is booked and leaves your page. Need to move it later? Reschedule from your portal.",
  },
];

const INTERVAL = 2600;

/**
 * The booking loop in three steps. The step in focus moves along on a timer, and each card's small picture plays its
 * moment when it is in focus. Everything is visible and readable at rest; with reduced motion nothing cycles.
 */
export function Bookings() {
  const [phase, setPhase] = useState(2);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setPhase((p) => (p + 1) % STEPS.length), INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const booked = phase === 2;

  return (
    <section id="bookings" className="scroll-mt-20 bg-[#f6f7f1] py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-medium text-(--leaf-deep)">Bookings</p>
          <h2 className="mx-auto mt-3 max-w-[18ch] text-[clamp(2.2rem,4.6vw,3.7rem)] leading-[1.04] font-semibold tracking-[-0.045em] text-balance text-(--ink)">
            Add your times. Review requests.{" "}
            <span className="bg-[linear-gradient(transparent_62%,var(--marker)_62%,var(--marker)_90%,transparent_90%)] px-[0.04em]">Get booked.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-(--quiet)">
            Clients choose from the times you choose. Nothing is booked until you say yes.
          </p>
        </div>

        <ol className="mt-14 grid gap-5 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.label}
              className={`flex flex-col rounded-3xl bg-white p-6 ring-1 transition-[box-shadow,transform] duration-500 lg:p-7 ${
                phase === i ? "-translate-y-1 shadow-[0_24px_48px_-30px_rgba(31,38,23,0.4)] ring-(--glow) ring-2" : "ring-(--hair)"
              }`}
            >
              {/* the picture: decorative, the text below says the same thing */}
              <div aria-hidden className="grid h-36 place-items-center rounded-2xl bg-[#fbfaf6] px-4 ring-1 ring-(--hair)">
                {i === 0 && <Times phase={phase} />}
                {i === 1 && <Request booked={booked} />}
                {i === 2 && <Booked booked={booked} />}
              </div>

              <h3 className="mt-6 flex items-center gap-3 text-[22px] leading-tight font-semibold tracking-[-0.025em] text-(--ink)">
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold transition-colors duration-500 ${
                    phase === i ? "bg-(--glow) text-(--ink)" : "bg-(--sage) text-(--moss)"
                  }`}
                >
                  {i + 1}
                </span>
                {step.label}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-(--quiet)">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const chip = "inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap tabular-nums";

/** Three days of the week; the middle time pops in each time this step comes into focus. */
function Times({ phase }: { phase: number }) {
  const days: [string, number, string | null][] = [
    ["Tue", 13, "3:00 PM"],
    ["Wed", 14, "5:00 PM"],
    ["Thu", 15, "11:00 AM"],
  ];
  return (
    <div className="grid w-full max-w-[290px] grid-cols-3 gap-2 text-center">
      {days.map(([day, date, time], i) => (
        <div key={day} className="grid gap-2">
          <div className="border-b border-(--hair) pb-1.5">
            <div className="text-[10px] font-semibold tracking-[0.08em] text-(--quiet) uppercase">{day}</div>
            <div className="text-[15px] font-semibold text-(--ink)">{date}</div>
          </div>
          <span
            key={i === 1 && phase === 0 ? "new" : "old"}
            className={`${chip} justify-center px-0 text-(--leaf-deep) ring-1 ring-(--sage-edge) ring-inset ${
              i === 1 && phase === 0 ? "motion-safe:animate-[flow-in_.55s_cubic-bezier(.2,.8,.2,1)_both]" : ""
            }`}
          >
            {time}
          </span>
        </div>
      ))}
    </div>
  );
}

/** One request, as it appears in the portal; Accept is pressed when the loop reaches "Get booked". */
function Request({ booked }: { booked: boolean }) {
  return (
    <div className="flex w-full max-w-[320px] items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-(--hair)">
      <div className="grid h-12 w-11 shrink-0 place-content-center rounded-xl bg-[#f6e8c8] text-center leading-none text-(--honey-text)">
        <span className="text-[9px] font-semibold tracking-[0.08em]">WED</span>
        <span className="mt-0.5 text-[17px] font-semibold">14</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-(--ink)">Ayesha Khan</div>
        <div className="truncate text-[12px] text-(--quiet)">5:00 PM · Online</div>
      </div>
      <span
        className={`${chip} h-7 px-3 text-[12px] transition-colors duration-500 ${
          booked ? "bg-(--leaf) text-white" : "bg-(--ink) text-white"
        }`}
      >
        {booked ? "Accepted" : "Accept"}
      </span>
    </div>
  );
}

/** The same time, now booked. */
function Booked({ booked }: { booked: boolean }) {
  return (
    <div className="grid justify-items-center gap-3 text-center">
      <span
        key={booked ? "booked" : "waiting"}
        className={`${chip} gap-2 px-4 transition-colors duration-500 ${
          booked
            ? "bg-(--leaf) text-white motion-safe:animate-[flow-in_.55s_cubic-bezier(.2,.8,.2,1)_both]"
            : "bg-[#f6e8c8] text-(--honey-text) ring-1 ring-[#8a5c00]/25 ring-inset"
        }`}
      >
        Wed 14 Oct · 5:00 PM
      </span>
      <span className="text-[13px] text-(--quiet)">{booked ? "Booked with Ayesha Khan" : "Waiting for your reply"}</span>
    </div>
  );
}
