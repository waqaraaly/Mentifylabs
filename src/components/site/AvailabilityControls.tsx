// One line-icon set, drawn the same way as the other new sections: 24 grid, 1.75 stroke, round caps.
const ICON = "size-5 fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]";

const WEEK: { day: string; times: string[] }[] = [
  { day: "Mon", times: ["9:00 – 12:00", "14:00 – 17:00"] },
  { day: "Wed", times: ["9:00 – 11:00", "16:00 – 18:00"] },
  { day: "Thu", times: ["14:00 – 17:00"] },
  { day: "Sat", times: [] },
];

const SPECIAL = new Set([17, 25]);
const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
// October 2026 starts on a Thursday and weeks start on Monday, so three blank cells come first.
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

const MODES = [
  { time: "Mon 9:00 – 12:00", mode: "Online" },
  { time: "Mon 14:00 – 17:00", mode: "In person" },
  { time: "Tue 11:00 – 13:00", mode: "Online" },
];

const MINI = "rounded-[14px] bg-[#f6f5ee] p-3.5 text-[13.5px]";

function Card({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-6 rounded-[18px] bg-white p-7 shadow-[0_0_0_1px_var(--hair)] xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>
        <span className="grid size-10 place-items-center rounded-[11px] bg-(--sage) text-(--moss)">
          <svg viewBox="0 0 24 24" className={ICON}>{icon}</svg>
        </span>
        <h3 className="mt-3.5 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-(--quiet)">{body}</p>
      </div>
      <div aria-hidden className={MINI}>
        {children}
      </div>
    </div>
  );
}

/**
 * "Full control of your calendar": four cards, one for each control (weekly hours, add a slot, special dates, online or in
 * person), each with a small true-to-life picture. Static. It says only what the app does: a weekly pattern, single times
 * and dates, and a mode for each time. The pictures are illustrations, so they are hidden from screen readers.
 */
export function AvailabilityControls() {
  return (
    <section id="availability" className="scroll-mt-20 bg-white py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="text-sm font-semibold tracking-[0.02em] text-(--leaf-deep)">Your availability</p>
          <h2 className="mt-3.5 text-[clamp(2.2rem,4.2vw,3.4rem)] leading-[1.06] font-semibold tracking-[-0.04em] text-balance text-(--ink)">
            Full control of your calendar.
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-(--quiet)">
            Set a weekly pattern, add one-off times, plan around special dates and choose how each session is held.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Card
            icon={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>}
            title="Weekly hours"
            body="Set the pattern you work to once. It repeats every week until you change it."
          >
            <div className="grid gap-1.5">
              {WEEK.map((w) => (
                <div key={w.day} className="flex flex-wrap items-center gap-2.5">
                  <b className="w-[34px] text-[13px] font-semibold">{w.day}</b>
                  {w.times.length ? (
                    w.times.map((t) => (
                      <span key={t} className="rounded-[7px] bg-[#dfe8cf] px-[9px] py-1 text-[12.5px] text-(--moss)">{t}</span>
                    ))
                  ) : (
                    <i className="text-[12.5px] text-[#aaa896] not-italic">Closed</i>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card
            icon={<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>}
            title="Add a slot"
            body="Open one extra time for a client who cannot make your usual hours."
          >
            <div className="grid grid-cols-2 gap-1.5">
              {["Tue 11:00", "Tue 14:00", "Fri 18:00", "Sat 10:00"].map((s) => (
                <span
                  key={s}
                  className={`rounded-lg py-2 text-center text-[13px] ${s === "Fri 18:00" ? "bg-(--leaf) text-white" : "bg-white shadow-[inset_0_0_0_1px_var(--hair)]"}`}
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <span className="flex-1 rounded-lg bg-white px-2.5 py-2 text-[12.5px] text-(--quiet) shadow-[inset_0_0_0_1px_var(--hair)]">Fri · 18:00</span>
              <b className="rounded-lg bg-(--ink) px-3.5 py-2 text-[12.5px] font-medium text-white">Add slot</b>
            </div>
          </Card>

          <Card
            icon={<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z" />}
            title="Special dates"
            body="Offer a day outside your usual week, so a client can book when you are not normally in."
          >
            <div className="grid grid-cols-7 gap-[3px] text-center text-xs">
              {WEEK_LABELS.map((l, i) => (
                <i key={i} className="pb-[3px] text-[11px] text-[#9a9b88] not-italic">{l}</i>
              ))}
              {[0, 1, 2].map((b) => (
                <span key={`b${b}`} />
              ))}
              {DAYS.map((d) => (
                <span key={d} className={`rounded-[7px] py-1.5 ${SPECIAL.has(d) ? "bg-(--glow) font-semibold" : "bg-white"}`}>{d}</span>
              ))}
            </div>
          </Card>

          <Card
            icon={<><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>}
            title="Online or in person"
            body="Say how each time is held, so clients choose what suits them."
          >
            <div className="grid gap-[7px]">
              {MODES.map((m) => (
                <div key={m.time} className="flex items-center justify-between rounded-[9px] bg-white px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--hair)]">
                  {m.time}
                  <span className="rounded-full bg-(--sage) px-2.5 py-0.5 text-xs font-medium text-(--moss)">{m.mode}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
