import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, MapPin, Video } from "lucide-react";
import { getCurrentPractitioner, isPubliclyVisible } from "@/data/practitioners";
import { getAppointmentsByPractitioner } from "@/data/appointments";
import { getSlotsByPractitioner } from "@/data/slots";
import { AutoRefresh } from "@/components/portal/AutoRefresh";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateFull, formatTime12h, daysBetween, getDateRange, greeting, mondayOf } from "@/lib/format";
import { wallClockIn } from "@/lib/time";

export const metadata = { title: "Dashboard" };

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default async function DashboardPage() {
  const practitioner = await getCurrentPractitioner();
  const [appointments, slots] = await Promise.all([
    getAppointmentsByPractitioner(practitioner.slug),
    getSlotsByPractitioner(practitioner.slug),
  ]);

  // Everything on this page is "now" on the practitioner's own clock, not the server's.
  const zone = practitioner.timezone;
  const here = wallClockIn(zone);
  const today = here.date;

  const todaysAppointments = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const todaysLive = todaysAppointments.filter((a) => a.status === "confirmed" || a.status === "completed");

  // Stored status is only what the practitioner/client agreed to; for a
  // confirmed session today, what's shown must follow the clock.
  const nowMinutes = here.minutes;
  const displayStatus = (a: (typeof todaysAppointments)[number]) => {
    if (a.status !== "confirmed") return a.status;
    if (toMinutes(a.endTime) <= nowMinutes) return "completed";
    if (toMinutes(a.startTime) <= nowMinutes) return "in progress";
    return "confirmed";
  };
  // Only confirmed sessions still ahead (or underway) today. Pending requests
  // live under "Waiting for your response" until they're confirmed.
  const upcomingToday = todaysAppointments.filter(
    (a) => a.status === "confirmed" && toMinutes(a.endTime) > nowMinutes,
  );
  const nextUpId = upcomingToday.find((a) => toMinutes(a.startTime) > nowMinutes)?.id;

  const pendingInquiries = appointments
    .filter((a) => a.status === "pending")
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  // "This week" is the calendar week (Mon–Sun) containing today.
  const weekDates = getDateRange(mondayOf(today), 7);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const inWeek = (s: (typeof slots)[number]) => s.date >= weekStart && s.date <= weekEnd;
  // Open slots that are still bookable: not in a past day or already-ended today.
  const openSlots = slots.filter(
    (s) =>
      s.status === "open" &&
      inWeek(s) &&
      (s.date > today || (s.date === today && toMinutes(s.endTime) > nowMinutes)),
  );
  const firstName = practitioner.fullName.split(" ")[0];

  // ── Spotlight: what's happening right now / next ──────────────────────────
  const nextUp = upcomingToday.find((a) => a.id === nextUpId);
  const inProgress = upcomingToday.find((a) => toMinutes(a.startTime) <= nowMinutes);
  const spotlight = inProgress ?? nextUp;
  const minutesUntil = (t: string) => Math.max(toMinutes(t) - nowMinutes, 0);
  const humanDuration = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };
  const nextOpenToday = slots.find(
    (s) => s.status === "open" && s.date === today && toMinutes(s.startTime) > nowMinutes,
  );

  // ── Metrics ───────────────────────────────────────────────────────────────
  const weekSessions = appointments.filter(
    (a) => a.date >= weekStart && a.date <= weekEnd && (a.status === "confirmed" || a.status === "completed"),
  );
  const oldestPendingDays = pendingInquiries.length
    ? Math.max(...pendingInquiries.map((a) => daysBetween(a.createdAt.slice(0, 10), today)))
    : 0;

  // ── Day ruler ─────────────────────────────────────────────────────────────
  const todaysOpenSlots = slots.filter((s) => s.status === "open" && s.date === today);
  const dayItems = [
    ...todaysLive.map((a) => ({ start: toMinutes(a.startTime), end: toMinutes(a.endTime) })),
    ...todaysOpenSlots.map((s) => ({ start: toMinutes(s.startTime), end: toMinutes(s.endTime) })),
  ];
  const rulerStart = Math.min(8 * 60, ...dayItems.map((i) => Math.floor(i.start / 60) * 60));
  const rulerEnd = Math.max(18 * 60, ...dayItems.map((i) => Math.ceil(i.end / 60) * 60));
  const rulerSpan = rulerEnd - rulerStart;
  const pct = (m: number) => ((m - rulerStart) / rulerSpan) * 100;
  const hourTicks = Array.from({ length: (rulerEnd - rulerStart) / 60 + 1 }, (_, i) => rulerStart + i * 60);
  const nowInRuler = nowMinutes >= rulerStart && nowMinutes <= rulerEnd;

  const card = "rounded-2xl bg-surface ring-1 ring-black/[0.07]";
  const cardHeader = "flex items-center justify-between gap-4 px-6 pt-5 pb-4";
  const cardTitle = "text-base font-semibold tracking-tight";
  const cardLink =
    "inline-flex items-center gap-1 text-sm font-medium text-primary transition hover:opacity-80";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-2 pb-12 sm:px-4">
      <AutoRefresh seconds={60} />

      {/* Header — same hairline-bottom rhythm as PageHeader, which every other
          portal page uses; kept bespoke here (greeting + date instead of an
          icon/title) since this is the one page without a fixed title. */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-black/[0.07] pt-2 pb-6">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">{formatDateFull(today)}</p>
          <h1 className="mt-2.5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting(zone)}, {firstName}.
          </h1>
        </div>
        {/* A link to the page clients see, once there is one. Until the profile is live there is nothing to link to. */}
        {isPubliclyVisible(practitioner) && (
          <Link href={`/${practitioner.slug}`} target="_blank" rel="noopener" className={cardLink}>
            Public profile
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </header>

      {/* Spotlight + metrics */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="relative flex min-h-[340px] flex-col overflow-hidden rounded-3xl bg-hero p-9 text-hero-foreground shadow-[0_24px_48px_-24px_color-mix(in_srgb,var(--hero)_55%,transparent)]">
          {spotlight ? (
            <>
              <div className="relative flex items-center gap-2">
                <span className="relative flex size-2">
                  {inProgress && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/60" />
                  )}
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                <p className="text-xs font-semibold tracking-[0.14em] uppercase opacity-80">
                  {inProgress ? "In progress" : "Up next"}
                </p>
              </div>

              <p className="relative mt-5 text-5xl leading-none font-semibold tracking-tight sm:text-6xl">
                {inProgress
                  ? `${humanDuration(minutesUntil(inProgress.endTime))} left`
                  : `in ${humanDuration(minutesUntil(spotlight.startTime))}`}
              </p>

              <div className="relative mt-6">
                <p className="text-xl font-medium">{spotlight.clientName}</p>
                <p className="mt-1 flex items-center gap-2 text-sm opacity-80">
                  {spotlight.sessionType === "online" ? (
                    <Video className="size-4" aria-hidden />
                  ) : (
                    <MapPin className="size-4" aria-hidden />
                  )}
                  {formatTime12h(spotlight.startTime)} – {formatTime12h(spotlight.endTime)} ·{" "}
                  {spotlight.sessionType === "online" ? "Online" : "On-Site"}
                </p>
              </div>

              <Link
                href="/dashboard/sessions"
                className="relative mt-auto inline-flex w-fit items-center gap-1.5 pt-6 text-sm font-medium opacity-90 transition hover:opacity-100"
              >
                Open in sessions
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </>
          ) : (
            <>
              <div className="relative flex items-center gap-2">
                <span className="size-2 rounded-full bg-white/70" />
                <p className="text-xs font-semibold tracking-[0.14em] uppercase opacity-80">All clear</p>
              </div>
              <p className="relative mt-5 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
                {todaysLive.length > 0 ? "That’s a wrap for today." : "A calm day ahead."}
              </p>
              <p className="relative mt-4 max-w-sm text-sm leading-relaxed opacity-80">
                {nextOpenToday
                  ? `Your next open slot is at ${formatTime12h(nextOpenToday.startTime)} if a client wants it.`
                  : "Nothing else is booked today. A good moment to catch up."}
              </p>
              <Link
                href="/dashboard/slots"
                className="relative mt-auto inline-flex w-fit items-center gap-1.5 pt-6 text-sm font-medium opacity-90 transition hover:opacity-100"
              >
                Manage availability
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </>
          )}
        </section>

        <div className="flex flex-col justify-center">
          {(
            [
              { label: "Left today", value: upcomingToday.length },
              { label: "This week", value: weekSessions.length },
              {
                label: "Awaiting response",
                value: pendingInquiries.length,
                href: "/dashboard/requests",
                tone: oldestPendingDays >= 3 ? "text-alert" : pendingInquiries.length > 0 ? "text-accent-strong" : "",
              },
              { label: "Open slots", value: openSlots.length, href: "/dashboard/slots" },
            ] as const
          ).map((row, i, rows) => {
            const rowClass = `flex items-baseline justify-between gap-4 ${
              i === 0 ? "pb-[22px]" : i === rows.length - 1 ? "pt-[22px]" : "py-[22px]"
            } ${i < rows.length - 1 ? "border-b border-border" : ""}`;
            const tone = "tone" in row ? row.tone : "";
            const content = (
              <>
                <span className={`text-sm ${tone || "text-muted"}`}>{row.label}</span>
                <span className={`text-[40px] leading-none font-bold tracking-tight tabular-nums ${tone}`}>
                  {row.value}
                </span>
              </>
            );
            return "href" in row ? (
              <Link key={row.label} href={row.href} className={`${rowClass} transition hover:opacity-70`}>
                {content}
              </Link>
            ) : (
              <div key={row.label} className={rowClass}>
                {content}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day ruler */}
      <section className={`${card} px-6 pt-5 pb-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={cardTitle}>Your day</h2>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-primary" /> Session
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm border border-dashed border-primary/60" /> Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-px bg-alert" /> Now
            </span>
          </div>
        </div>

        <div className="themed-scrollbar mt-5 overflow-x-auto pb-1">
          <div className="relative min-w-[640px]">
            {/* hour labels */}
            <div className="relative h-5">
              {hourTicks.map((m, i) => (
                <span
                  key={m}
                  style={{ left: `${pct(m)}%` }}
                  className={`absolute text-[11px] whitespace-nowrap text-muted tabular-nums ${
                    i === 0 ? "" : i === hourTicks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"
                  }`}
                >
                  {formatTime12h(`${String(m / 60).padStart(2, "0")}:00`).replace(":00 ", " ")}
                </span>
              ))}
            </div>

            {/* track */}
            <div className="relative mt-2 h-16 rounded-xl bg-black/[0.03]">
              {hourTicks.slice(1, -1).map((m) => (
                <span
                  key={m}
                  style={{ left: `${pct(m)}%` }}
                  className="absolute top-0 h-full w-px bg-black/[0.05]"
                  aria-hidden
                />
              ))}

              {/* elapsed */}
              {nowInRuler && (
                <span
                  style={{ width: `${pct(nowMinutes)}%` }}
                  className="absolute top-0 left-0 h-full rounded-l-xl bg-black/[0.035]"
                  aria-hidden
                />
              )}

              {/* open slots */}
              {todaysOpenSlots.map((s) => (
                <span
                  key={s.id}
                  title={`Open · ${formatTime12h(s.startTime)}–${formatTime12h(s.endTime)}`}
                  style={{ left: `${pct(toMinutes(s.startTime))}%`, width: `${pct(toMinutes(s.endTime)) - pct(toMinutes(s.startTime))}%` }}
                  className="absolute top-2 bottom-2 rounded-lg border border-dashed border-primary/45 bg-primary/[0.04]"
                />
              ))}

              {/* sessions */}
              {todaysLive.map((a) => {
                const ended = toMinutes(a.endTime) <= nowMinutes;
                return (
                  <span
                    key={a.id}
                    title={`${a.clientName} · ${formatTime12h(a.startTime)}–${formatTime12h(a.endTime)}`}
                    style={{ left: `${pct(toMinutes(a.startTime))}%`, width: `${pct(toMinutes(a.endTime)) - pct(toMinutes(a.startTime))}%` }}
                    className={`absolute top-2 bottom-2 flex items-center overflow-hidden rounded-lg px-2 text-xs font-medium ${
                      ended ? "bg-primary/25 text-foreground/70" : "bg-primary text-primary-foreground shadow-sm"
                    }`}
                  >
                    <span className="truncate">{a.clientName.split(" ")[0]}</span>
                  </span>
                );
              })}

              {/* now marker */}
              {nowInRuler && (
                <span
                  style={{ left: `${pct(nowMinutes)}%` }}
                  className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-alert"
                  aria-hidden
                >
                  <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-alert" />
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Schedule */}
        <section className={card}>
          <div className={cardHeader}>
            <h2 className={cardTitle}>Later today</h2>
            <Link href="/dashboard/sessions" className={cardLink}>
              All sessions
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {upcomingToday.length === 0 ? (
            <p className="px-6 pt-1 pb-7 text-sm leading-relaxed text-muted">
              No more sessions today.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.06] border-t border-black/[0.06]">
              {upcomingToday.map((appointment) => (
                <li key={appointment.id} className="flex items-center gap-5 px-6 py-4">
                  <div className="w-20 shrink-0 whitespace-nowrap">
                    <p className="text-sm font-semibold tabular-nums">{formatTime12h(appointment.startTime)}</p>
                    <p className="mt-0.5 text-xs text-muted tabular-nums">{formatTime12h(appointment.endTime)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{appointment.clientName}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                      {appointment.sessionType === "online" ? (
                        <Video className="size-3.5" aria-hidden />
                      ) : (
                        <MapPin className="size-3.5" aria-hidden />
                      )}
                      {appointment.sessionType === "online" ? "Online" : "On-Site"}
                    </p>
                  </div>
                  <StatusBadge status={displayStatus(appointment)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Waiting for a response */}
        <section className={card}>
          <div className={cardHeader}>
            <h2 className={cardTitle}>Waiting for your response</h2>
            <Link href="/dashboard/requests" className={cardLink}>
              Review all
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {pendingInquiries.length === 0 ? (
            <p className="px-6 pt-1 pb-7 text-sm leading-relaxed text-muted">You&apos;re all caught up.</p>
          ) : (
            <>
              <ul className="divide-y divide-black/[0.06] border-t border-black/[0.06]">
                {pendingInquiries.slice(0, 3).map((inquiry) => (
                  <li key={inquiry.id}>
                    <Link
                      href="/dashboard/requests"
                      className="group flex items-center gap-4 px-6 py-4 transition hover:bg-black/[0.02]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{inquiry.clientName}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {formatDate(inquiry.date)} · {formatTime12h(inquiry.startTime)}–{formatTime12h(inquiry.endTime)}
                        </p>
                      </div>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              {pendingInquiries.length > 3 && (
                <p className="border-t border-black/[0.06] px-6 py-3.5 text-sm text-muted">
                  +{pendingInquiries.length - 3} more waiting
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
