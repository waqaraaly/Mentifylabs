"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ProfileHero } from "@/components/practitioner/ProfileHero";
import { COLOR_THEMES, type ColorThemeId } from "@/lib/themes";
import type { FeatureSlug } from "@/lib/featurePages";
import type { Practitioner } from "@/types/practitioner";

// One card language for every picture: white, a hairline ring and a soft shadow.
const card =
  "rounded-2xl bg-white ring-1 ring-(--hair) shadow-[0_24px_48px_-32px_rgba(31,38,23,0.35)]";
const chip =
  "inline-flex h-8 items-center justify-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap tabular-nums";

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts 0, 1, 2 … every `ms`, for pictures that play a small loop. Stays at `rest` when motion is reduced. */
function useBeat(steps: number, ms: number, rest = steps - 1) {
  const [n, setN] = useState(rest);
  useEffect(() => {
    if (reduced()) return;
    const timer = setInterval(() => setN((i) => (i + 1) % steps), ms);
    return () => clearInterval(timer);
  }, [steps, ms]);
  return n;
}

/* ---------- personal link ---------- */
const SLUGS = ["hina-farooq", "dr-sara-malik", "ayesha-khan", "your-name"];

/** The link typing through names. `places` adds the row of places to share it, shown on the feature page but not in the hero. */
function LinkVisual({ places = true }: { places?: boolean }) {
  const [text, setText] = useState(SLUGS[0]);
  useEffect(() => {
    if (reduced()) return;
    let word = 0,
      n = SLUGS[0].length,
      dir = -1,
      pause = 30;
    const timer = setInterval(() => {
      if (pause > 0) return void (pause -= 1);
      n += dir;
      if (dir < 0 && n <= 0) {
        word = (word + 1) % SLUGS.length;
        dir = 1;
        n = 0;
      } else if (dir > 0 && n >= SLUGS[word].length) {
        dir = -1;
        pause = 30;
      }
      setText(SLUGS[word].slice(0, Math.max(0, n)));
    }, 60);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid w-full max-w-[460px] gap-5">
      <div
        className={`${card} flex items-center gap-3 rounded-full py-3 pr-3 pl-5`}
      >
        <span className="size-2.5 shrink-0 rounded-full bg-(--glow)" />
        <p className="min-w-0 flex-1 truncate text-[clamp(1rem,2.4vw,1.35rem)] tracking-[-0.01em] text-(--quiet)">
          mentifylabs.com/<b className="font-semibold text-(--ink)">{text}</b>
          <span className="ml-0.5 inline-block h-[1.05em] w-[2px] animate-pulse bg-(--honey) align-[-0.15em]" />
        </p>
        <span className="shrink-0 rounded-full bg-(--ink) px-4 py-2 text-[13px] font-medium text-white">
          Copy
        </span>
      </div>
      {places && (
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Instagram bio",
            "WhatsApp",
            "Email signature",
            "Business card",
            "LinkedIn",
          ].map((place) => (
            <span
              key={place}
              className="rounded-full bg-white/80 px-3.5 py-1.5 text-[13px] text-(--quiet) ring-1 ring-(--hair)"
            >
              {place}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- open times ---------- */
function TimesVisual() {
  const beat = useBeat(3, 1600);
  const days: [string, number, string[]][] = [
    ["Mon", 12, ["10:00 AM", "3:00 PM"]],
    ["Tue", 13, ["11:00 AM"]],
    ["Wed", 14, ["5:00 PM"]],
    ["Thu", 15, ["10:00 AM", "4:00 PM"]],
  ];
  return (
    <div className="grid w-full max-w-[480px] gap-3">
      <div className={`${card} p-4`}>
        <div className="flex items-baseline justify-between">
          <p className="text-[15px] font-semibold text-(--ink)">Weekly hours</p>
          <p className="text-[12.5px] text-(--quiet)">Repeats every week</p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {days.map(([d, n, times], i) => (
            <div key={d} className="grid content-start gap-1.5">
              <div className="border-b border-(--hair) pb-1.5">
                <div className="text-[10px] font-semibold tracking-[0.08em] text-(--quiet) uppercase">
                  {d}
                </div>
                <div className="text-[15px] font-semibold text-(--ink)">
                  {n}
                </div>
              </div>
              {times.map((t, j) => (
                <span
                  key={t}
                  className={`${chip} h-7 px-0 text-[12px] ring-1 ring-inset ${i === 2 && j === 0 && beat > 0 ? "bg-(--leaf) text-white ring-(--leaf)" : "text-(--leaf-deep) ring-(--sage-edge)"}`}
                >
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={`${card} p-4`}>
          <p className="text-[12px] font-semibold tracking-[0.06em] text-(--quiet) uppercase">
            Special date
          </p>
          <p className="mt-1.5 text-[15px] font-semibold text-(--ink)">
            Sat 17 Oct
          </p>
          <span
            className={`${chip} mt-2 h-7 text-[12px] text-(--leaf-deep) ring-1 ring-(--sage-edge) ring-inset`}
          >
            12:00 PM · Online
          </span>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-[12px] font-semibold tracking-[0.06em] text-(--quiet) uppercase">
            Unavailable
          </p>
          <p className="mt-1.5 text-[15px] font-semibold text-(--ink)">
            20 – 22 Oct
          </p>
          <span
            className={`${chip} mt-2 h-7 bg-[#f6e8c8] text-[12px] text-(--honey-text)`}
          >
            Away
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- booking requests ---------- */
function RequestsVisual() {
  const beat = useBeat(3, 1800);
  const accepted = beat === 2;
  return (
    <div className="grid w-full max-w-[460px] gap-3">
      <div className={`${card} p-4`}>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-11 shrink-0 place-content-center rounded-xl bg-[#f6e8c8] text-center leading-none text-(--honey-text)">
            <span className="text-[9px] font-semibold tracking-[0.08em]">
              WED
            </span>
            <span className="mt-0.5 text-[17px] font-semibold">14</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-(--ink)">
              Ayesha Khan
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase transition-colors duration-500 ${accepted ? "bg-(--sage) text-(--moss)" : "bg-[#f6e8c8] text-(--honey-text)"}`}
              >
                {accepted ? "Booked" : "New"}
              </span>
            </p>
            <p className="text-[12.5px] text-(--quiet)">
              5:00 PM · Online · First session
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-[#faf9f4] px-3.5 py-3 text-[13px] leading-relaxed text-(--quiet) ring-1 ring-(--hair)">
          <span className="mb-1 flex items-center justify-between text-[11px] font-semibold tracking-[0.06em] uppercase">
            Client&apos;s message{" "}
            <span className="rounded-md bg-[#f6e8c8] px-1.5 py-0.5 text-[10px] text-(--honey-text)">
              Private
            </span>
          </span>
          I have been feeling anxious at work and would like to talk to someone.
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <span
            className={`rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-(--ink) ring-1 ring-black/10 transition-opacity duration-500 ${accepted ? "opacity-40" : ""}`}
          >
            Decline
          </span>
          <span
            className={`rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors duration-500 ${accepted ? "bg-(--leaf) text-white" : "text-(--honey-text) ring-1 ring-[#8a5c00]/40"}`}
          >
            {accepted ? "Accepted ✓" : "Accept"}
          </span>
        </div>
      </div>
      <p className="text-center text-[13px] text-(--quiet)">
        No account for the client. Nothing is booked until you accept.
      </p>
    </div>
  );
}

/* ---------- sessions ---------- */
function SessionsVisual() {
  const rows = [
    ["WED", "14", "Ayesha Khan", "5:00 PM · Online"],
    ["THU", "15", "Bilal Ahmed", "11:00 AM · On site"],
    ["FRI", "16", "Sana Iqbal", "6:00 PM · Online"],
  ];
  return (
    <div className={`${card} w-full max-w-[480px] overflow-hidden`}>
      <div className="flex gap-1 border-b border-(--hair) px-3 pt-3 text-[12.5px] font-medium">
        {[
          ["Upcoming", 3],
          ["Overdue", 0],
          ["Completed", 12],
          ["Cancelled", 1],
        ].map(([tab, n], i) => (
          <span
            key={tab}
            className={`flex items-center gap-1.5 rounded-t-lg px-3 pb-2.5 ${i === 0 ? "border-b-2 border-(--ink) text-(--ink)" : "text-(--quiet)"}`}
          >
            {tab}
            <span className="rounded-full bg-(--sage) px-1.5 text-[10.5px] text-(--moss) tabular-nums">
              {n}
            </span>
          </span>
        ))}
      </div>
      <ul className="divide-y divide-(--hair)">
        {rows.map(([d, n, name, meta], i) => (
          <li key={name} className="flex items-center gap-3 px-4 py-3">
            <div className="grid h-11 w-10 shrink-0 place-content-center rounded-xl bg-(--sage) text-center leading-none text-(--moss)">
              <span className="text-[9px] font-semibold tracking-[0.08em]">
                {d}
              </span>
              <span className="mt-0.5 text-[16px] font-semibold">{n}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-(--ink)">
                {name}
              </p>
              <p className="truncate text-[12px] text-(--quiet)">{meta}</p>
            </div>
            <span
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold ring-1 ring-black/10 ${i === 1 ? "bg-(--ink) text-white ring-0" : "text-(--ink)"}`}
            >
              Reschedule
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- the real profile hero, laid out at desktop or phone width and scaled into its box ---------- */
const SAMPLE: Practitioner = {
  slug: "hina-farooq",
  fullName: "Hina Farooq",
  professionalTitle: "Marriage & Family Therapist",
  email: "hina.farooq@example.com",
  bio: "",
  specializations: [],
  services: [],
  experienceYears: 5,
  education: [],
  languages: [],
  sessionType: "online",
  feeRange: { currency: "PKR", min: 2500, max: 4000 },
  timezone: "Asia/Karachi",
  socialLinks: [],
  contactMethods: [],
  status: "active",
  profileStatus: "published",
  creationMethod: "self",
  dateJoined: "2026-01-01",
  verificationStatus: "verified",
  acceptingBookings: true,
};

const WIDE = "(min-width: 1024px)";
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useWide = () =>
  useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );

function ScaledHero({
  theme,
  verified = true,
  children,
}: {
  theme: ColorThemeId;
  verified?: boolean;
  children?: ReactNode;
}) {
  const wide = useWide();
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const watch = new ResizeObserver(() => setW(el.clientWidth));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const pageWidth = wide ? 1200 : 420;
  const pageHeight = wide ? 640 : 860;
  const k = w / pageWidth;
  return (
    <div
      ref={box}
      inert
      className="relative w-full overflow-hidden rounded-[22px] shadow-[0_30px_60px_-36px_rgba(31,38,23,0.45)]"
      style={{ height: k ? pageHeight * k : 0 }}
    >
      {k > 0 && (
        <div
          data-pt-theme={theme}
          className="absolute top-0 left-0 origin-top-left bg-(--pt-outer) p-[16.5px] [font-family:var(--font-inter),Arial,Helvetica,sans-serif] transition-colors duration-500"
          style={{
            width: pageWidth,
            height: pageHeight,
            transform: `scale(${k})`,
          }}
        >
          <div className="h-full overflow-hidden rounded-[36px] bg-(--pt-bg) pb-10 text-(--pt-text) transition-colors duration-500">
            <ProfileHero
              practitioner={{
                ...SAMPLE,
                verificationStatus: verified ? "verified" : "unverified",
              }}
            />
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

/* ---------- verified badge ---------- */
function VerifiedVisual() {
  const beat = useBeat(4, 1500);
  const verified = beat >= 2;
  return (
    <div className="grid w-full max-w-[560px] gap-3">
      <ScaledHero theme="moss-honey" verified={verified} />
      <div
        className={`${card} grid grid-cols-3 divide-x divide-(--hair) px-1 py-3 text-center`}
      >
        {["License", "Degree", "Membership"].map((doc, i) => (
          <div key={doc} className="grid justify-items-center gap-1.5 px-2">
            <span className="text-[13.5px] font-medium text-(--ink)">
              {doc}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold transition-colors duration-500 ${
                beat > i - 1 && beat >= 1
                  ? "bg-(--sage) text-(--moss)"
                  : "bg-[#f6e8c8] text-(--honey-text)"
              }`}
            >
              {beat > i - 1 && beat >= 1 ? "Approved" : "In review"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- colour themes: pick one and the real profile header takes it on ---------- */
function ThemesVisual() {
  const [pick, setPick] = useState<ColorThemeId>("moss-honey");
  const current = COLOR_THEMES.find((t) => t.id === pick);
  return (
    <div className="grid w-full max-w-[560px] gap-4">
      <ScaledHero theme={pick} />
      <div
        className="flex flex-wrap items-center justify-center gap-2.5"
        role="radiogroup"
        aria-label="Try a colour theme"
      >
        {COLOR_THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={pick === t.id}
            aria-label={t.name}
            title={t.name}
            onClick={() => setPick(t.id)}
            className="size-8 overflow-hidden rounded-full transition-transform hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${t.swatches[1] ?? t.swatches[0]} 50%, ${t.swatches[2] ?? t.swatches[0]} 50%)`,
              boxShadow:
                pick === t.id
                  ? "0 0 0 2px #fff, 0 0 0 4px var(--ink)"
                  : "0 0 0 1px var(--hair)",
            }}
          />
        ))}
      </div>
      <p
        className="text-center text-[13.5px] text-(--quiet)"
        aria-live="polite"
      >
        {current?.name}
      </p>
    </div>
  );
}

/* ---------- page stats ---------- */
const BARS = [22, 30, 26, 41, 35, 48, 39, 52, 46, 61, 55, 68, 58, 72];

function StatsVisual() {
  const max = Math.max(...BARS);
  return (
    <div className="grid w-full max-w-[500px] gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Profile views", "653"],
          ["Visitors", "412"],
          ["Requests", "29"],
          ["Request rate", "7%"],
        ].map(([label, value]) => (
          <div key={label} className={`${card} px-3.5 py-3`}>
            <p className="text-[11.5px] text-(--quiet)">{label}</p>
            <p className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-(--ink) tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className={`${card} p-4`}>
        <p className="text-[13px] font-semibold text-(--ink)">Views per day</p>
        <div className="mt-3 flex h-28 items-end gap-1.5" aria-hidden>
          {BARS.map((v, i) => (
            <span
              key={i}
              className={`flex-1 rounded-t-md motion-safe:animate-[flow-in_.6s_cubic-bezier(.2,.8,.2,1)_both] ${i === BARS.length - 1 ? "bg-(--leaf)" : "bg-(--sage-edge)"}`}
              style={{
                height: `${(v / max) * 100}%`,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>
      </div>
      <div className={`${card} grid gap-2 p-4`}>
        <p className="text-[13px] font-semibold text-(--ink)">
          Where visitors come from
        </p>
        {[
          ["Instagram", 46],
          ["WhatsApp", 31],
          ["Direct", 15],
          ["Google", 8],
        ].map(([source, share]) => (
          <div
            key={source}
            className="grid grid-cols-[80px_1fr_36px] items-center gap-3 text-[12.5px] text-(--quiet)"
          >
            {source}
            <span className="h-2 overflow-hidden rounded-full bg-(--sage)">
              <span
                className="block h-full rounded-full bg-(--leaf)"
                style={{ width: `${share}%` }}
              />
            </span>
            <span className="text-right tabular-nums">{share}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- privacy and control: switches you can flip ---------- */
function Switch({
  label,
  note,
  on,
  onChange,
}: {
  label: string;
  note: [string, string];
  on: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <p className="text-[14.5px] font-medium text-(--ink)">
        {label}
        <span className="block text-[12.5px] font-normal text-(--quiet)">
          {on ? note[0] : note[1]}
        </span>
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-(--leaf)" : "bg-[#d9d6cd]"}`}
      >
        <span
          className="absolute top-1 size-5 rounded-full bg-white shadow transition-[left] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
          style={{ left: on ? 24 : 4 }}
        />
      </button>
    </div>
  );
}

function PrivacyVisual() {
  const [visible, setVisible] = useState(true);
  const [booking, setBooking] = useState(true);
  const [twoStep, setTwoStep] = useState(true);
  return (
    <div className="grid w-full max-w-[460px] gap-3">
      <div className={`${card} divide-y divide-(--hair)`}>
        <Switch
          label="Page visible"
          note={[
            "Anyone with your link can see it",
            "Your link shows a short note instead",
          ]}
          on={visible}
          onChange={() => setVisible((v) => !v)}
        />
        <Switch
          label="Accepting bookings"
          note={[
            "Clients can request your open times",
            "Your page stays up; nobody can book",
          ]}
          on={booking}
          onChange={() => setBooking((v) => !v)}
        />
        <Switch
          label="Two-step sign-in"
          note={["A code by email each time you sign in", "Password only"]}
          on={twoStep}
          onChange={() => setTwoStep((v) => !v)}
        />
      </div>
      <div
        className={`${card} flex items-center justify-between gap-3 px-5 py-3.5`}
      >
        <p className="text-[14px] text-(--ink)">
          +92 300 7654321
          <span className="block text-[12px] text-(--quiet)">Phone</span>
        </p>
        <span className="rounded-full bg-[#f6e8c8] px-2.5 py-1 text-[11.5px] font-semibold text-(--honey-text)">
          Private
        </span>
      </div>
    </div>
  );
}

const VISUALS: Record<FeatureSlug, () => ReactNode> = {
  "personal-link": () => <LinkVisual />,
  "open-times": TimesVisual,
  "booking-requests": RequestsVisual,
  sessions: SessionsVisual,
  "verified-badge": VerifiedVisual,
  "colour-themes": ThemesVisual,
  "page-stats": StatsVisual,
  "privacy-and-control": PrivacyVisual,
};

/** The picture for one feature: a working, simplified view of that part of the app. `inHero` trims it for the homepage tour. */
export function FeatureVisual({
  slug,
  inHero = false,
}: {
  slug: FeatureSlug;
  inHero?: boolean;
}) {
  if (slug === "personal-link") return <LinkVisual places={!inHero} />;
  const Visual = VISUALS[slug];
  return <Visual />;
}
