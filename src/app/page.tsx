import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Link2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/lib/site";

const TRUST_POINTS = [
  { icon: ShieldCheck, text: "Every practitioner is reviewed before their profile goes live" },
  { icon: Clock3, text: "Real-time availability — no back-and-forth to find a time" },
  { icon: HeartHandshake, text: "Online or in-person sessions, your choice" },
];

const STEPS = [
  {
    icon: Link2,
    title: "Open their link",
    text: "Your practitioner shares a personal MentifyLabs page — no account needed to book.",
  },
  {
    icon: CalendarCheck2,
    title: "Pick a time",
    text: "See their real open slots and choose whatever works for your week.",
  },
  {
    icon: MessageCircle,
    title: "Hear back fast",
    text: "They confirm your request, and you get a clear time, format, and reminder.",
  },
];

const PRACTITIONER_FEATURES = [
  {
    icon: CalendarCheck2,
    title: "One calendar for everything",
    text: "Set your availability once; bookings, reschedules and cancellations stay in sync automatically.",
  },
  {
    icon: MessageCircle,
    title: "A calm requests inbox",
    text: "New booking requests land in one place, ready to confirm or decline in a click.",
  },
  {
    icon: ShieldCheck,
    title: "A profile clients trust",
    text: "A clean, professional page with your credentials, specializations, and a shareable link.",
  },
  {
    icon: HeartHandshake,
    title: "Room to grow",
    text: "Manage sessions, track requests, and keep your practice organized as it scales.",
  },
];

export default function Home() {
  return (
    <main className="bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            M
          </span>
          <span className="text-base font-semibold tracking-tight">{siteConfig.name}</span>
        </Link>
        <Link
          href="/login"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-surface"
        >
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 lg:px-10 lg:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 text-xs font-medium tracking-[0.08em] text-muted uppercase ring-1 ring-border">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            Mental health, made easier to reach
          </p>
          <h1 className="mt-6 font-serif text-4xl leading-[1.15] sm:text-5xl">
            Care that&apos;s easy to find, and easier to run.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            {siteConfig.name} gives clients a simple way to book real therapists and mental
            health practitioners, and gives practitioners one calm workspace to run their
            practice — availability, requests and sessions, all in one place.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Join as a practitioner
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-surface px-6 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-background"
            >
              Log in to your portal
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-3 rounded-2xl bg-surface p-5 text-sm text-foreground ring-1 ring-border"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border">
                <Icon className="size-4" aria-hidden />
              </span>
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* How it works for clients */}
      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">For clients</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight">Booking a session takes minutes.</h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <span className="text-xs font-semibold tracking-[0.1em] text-muted">
                  STEP {i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built for practitioners */}
      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">For practitioners</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight">
            A practice workspace that stays out of your way.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Less admin, more time with clients — set your hours once and let the rest run itself.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PRACTITIONER_FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl bg-surface p-6 ring-1 ring-border">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground sm:px-14">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Bring a little calm to your practice.
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-primary-foreground/85">
            Create your profile, set your availability, and start taking bookings today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:opacity-90"
          >
            Get started — it&apos;s free
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
            <CheckCircle2 className="size-3.5" aria-hidden />
            No credit card required
          </p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-10 text-sm text-muted lg:px-10">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <p className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
        </p>
      </footer>
    </main>
  );
}
