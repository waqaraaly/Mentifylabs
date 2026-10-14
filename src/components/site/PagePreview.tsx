"use client";

import { useEffect, useRef, useState } from "react";
import { AreasOfExpertise } from "@/components/practitioner/AreasOfExpertise";
import { ProfileHero } from "@/components/practitioner/ProfileHero";
import { ServicesOffered } from "@/components/practitioner/ServicesOffered";
import { siteConfig } from "@/lib/site";
import type { ColorThemeId } from "@/lib/themes";
import type { Practitioner, SessionType } from "@/types/practitioner";

export interface PreviewState {
  name: string;
  title: string;
  areas: string[];
  mode: SessionType;
  theme: ColorThemeId;
  /** Show the verified badge, which a real profile gets once its documents have been reviewed. */
  verified: boolean;
  /** A callout over the page for the step being read: its open times, or what the badge means. */
  overlay: "times" | "trust" | null;
  /** The link the page would live at, already tidied. */
  slug: string;
}

/**
 * A practitioner built from what the visitor typed. Everything they didn't type is plain sample text, and the page says
 * so. It is the same shape the real profile uses, which is what lets the real profile components draw it.
 */
function sample(p: PreviewState): Practitioner {
  return {
    slug: p.slug || "your-name",
    fullName: p.name.trim() || "Your Name",
    professionalTitle: p.title.trim() || "Your professional title",
    email: "",
    shortBio: "Helping people feel heard, one honest conversation at a time.",
    bio: "",
    specializations: p.areas,
    services: ["Individual Therapy", "Couples Counselling", "Online sessions"],
    experienceYears: 8,
    education: [],
    languages: [],
    sessionType: p.mode,
    feeRange: { currency: "PKR", min: 3000, max: 5000 },
    timezone: "Asia/Karachi",
    socialLinks: [],
    contactMethods: [],
    colorTheme: p.theme,
    status: "active",
    profileStatus: "published",
    creationMethod: "self",
    dateJoined: "2026-01-01",
    verificationStatus: p.verified ? "verified" : "unverified",
    acceptingBookings: true,
  };
}

const SLOTS = ["Tomorrow  10:00 AM", "Tomorrow  4:30 PM", "In 2 days  11:00 AM", "In 2 days  6:00 PM"];

/** The page the visitor is building, drawn by the product's own profile components, scaled to fit. Desktop only. */
export function PagePreview(state: PreviewState) {
  const holder = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const WIDTH = 920; // the width the page is laid out at before it is scaled down

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / WIDTH));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const practitioner = sample(state);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_50px_90px_-45px_rgba(42,51,32,0.55)] ring-1 ring-(--sage-edge)">
      <div className="flex shrink-0 items-center gap-2 border-b border-(--hair) px-5 py-3.5">
        <span className="size-2.5 rounded-full bg-(--hair)" />
        <span className="size-2.5 rounded-full bg-(--hair)" />
        <span className="size-2.5 rounded-full bg-(--hair)" />
        <p className="ml-3 truncate font-mono text-[12.5px] text-(--quiet)">
          mentifylabs.com/<span className="text-(--ink)">{state.slug || "your-name"}</span>
        </p>
        <span className="ml-auto text-[10px] font-semibold tracking-[0.14em] text-(--quiet) uppercase">Preview</span>
      </div>

      {/* The frame is the page's own outer colour, so the page seems to carry on below what is shown. */}
      <div ref={holder} data-pt-theme={state.theme} className="relative min-h-0 flex-1 overflow-hidden bg-(--pt-outer) transition-colors duration-500">
        <div style={{ width: WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }} className="p-4">
          <div className="overflow-hidden rounded-[32px] bg-(--pt-bg) pb-12 text-(--pt-text) transition-colors duration-500">
            <div className="flex items-center justify-between border-b border-(--pt-border) px-8 py-4">
              <p className="text-2xl tracking-[0.02em]">{siteConfig.name}</p>
              <span className="rounded-full bg-(--pt-accent) px-6 py-2.5 text-[15px] font-semibold text-(--pt-accent-foreground)">Book a Session</span>
            </div>
            <ProfileHero practitioner={practitioner} />
            <div className="mx-auto max-w-5xl px-[10px]">
              <AreasOfExpertise practitioner={practitioner} />
              <ServicesOffered practitioner={practitioner} />
            </div>
          </div>
        </div>

        {/* A callout for the step being read, drawn in the page's own colours. The times are a sample. */}
        <div
          data-pt-theme={state.theme}
          aria-hidden={!state.overlay}
          className={`absolute inset-x-5 bottom-5 rounded-2xl bg-(--pt-bg) p-4 shadow-[0_24px_50px_-20px_rgba(32,34,31,0.45)] ring-1 ring-(--pt-border) transition-all duration-500 ${
            state.overlay ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
          }`}
        >
          {state.overlay === "trust" ? (
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" className="size-12 shrink-0" aria-hidden>
                <circle cx="12" cy="12" r="10" fill="var(--pt-accent)" />
                <path d="M7 12.5 10.2 15.5 17 8.5" fill="none" stroke="var(--pt-accent-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-(--pt-text)">
                <p className="text-[17px] font-semibold">Verified practitioner</p>
                <p className="mt-0.5 text-[13px] text-(--pt-muted)">A person on our team has read their documents.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-(--pt-muted) uppercase">Open this week · sample times</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SLOTS.map((slot, i) => {
                  const [day, time] = slot.split("  ");
                  return (
                    <span key={slot} className={`rounded-xl border-2 px-4 py-2.5 text-sm ${i === 1 ? "border-(--pt-accent) bg-(--pt-accent) text-(--pt-accent-foreground)" : "border-(--pt-border) text-(--pt-text)"}`}>
                      <span className="block text-[11px] opacity-70">{day}</span>
                      <span className="font-semibold">{time}</span>
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** The phone version: a short strip that keeps the page in view while the visitor works down the steps. */
export function MiniPreview(state: PreviewState) {
  const initials = (state.name.trim() || "Your Name").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <div data-pt-theme={state.theme} className="bg-(--pt-outer) px-4 py-3 transition-colors duration-500">
      <div className="flex items-center gap-3.5 rounded-2xl bg-(--pt-bg) p-3 text-(--pt-text) transition-colors duration-500">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-[60%_40%_30%_70%/55%_45%_65%_35%] bg-white font-serif text-xl text-(--pt-accent)">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[17px] leading-tight font-bold">
            <span className="truncate">{state.name.trim() || "Your Name"}</span>
            {state.verified && (
              <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-label="Verified">
                <circle cx="12" cy="12" r="10" fill="var(--pt-accent)" />
                <path d="M7 12.5 10.2 15.5 17 8.5" fill="none" stroke="var(--pt-accent-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </p>
          <p className="truncate text-[13px] text-(--pt-muted)">{state.title.trim() || "Your professional title"}</p>
          <p className="mt-1.5 flex gap-1.5 overflow-hidden">
            {state.areas.slice(0, 3).map((area) => (
              <span key={area} className="shrink-0 rounded-md bg-(--pt-accent) px-2 py-0.5 text-[11px] text-(--pt-accent-foreground)">
                {area}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
