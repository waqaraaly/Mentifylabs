"use client";

import { type KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { CredentialPicker, useCredentialPicker } from "@/components/portal/CredentialPicker";
import { LoadingOverlay } from "@/components/ui/BrainLoader";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { siteConfig } from "@/lib/site";
import { offsetLabel, timeZoneOptions } from "@/lib/time";
import { useDeviceTimeZone } from "@/lib/useDeviceTimeZone";
import type { SessionType } from "@/types/practitioner";
import { checkHandleAction } from "@/app/dashboard/profile/actions";
import { claimHandleAction, finishOnboardingAction, skipOnboardingAction, suggestHandleAction } from "./actions";
import { PUBLIC_NAME_MAX } from "@/lib/publicName";

const SESSION_OPTIONS: { value: SessionType; label: string }[] = [
  { value: "online", label: "Online sessions" },
  { value: "offline", label: "In person" },
  { value: "both", label: "Both" },
];

/**
 * The steps in order, by name rather than number, so one can be left out: the location step only applies to sessions in
 * person. After the last of these comes the closing screen. Setup is only the essentials; the rest of the profile
 * (photo, About me, expertise, services, education, experience, fee, weekly hours) is done from the dashboard checklist.
 */
type StepId = "name" | "title" | "mode" | "location" | "zone" | "link" | "credentials";
const STEP_ORDER: StepId[] = ["name", "title", "mode", "location", "zone", "link", "credentials"];

const headingClass = "text-3xl leading-tight font-semibold sm:text-[40px]";
const subtitleClass = "mt-3 max-w-lg text-[15px] leading-relaxed text-muted";

// Shared look for every pick-one option (session type, document category).
const optionClass = "rounded-xl border text-left transition";
const optionActiveClass = "border-primary bg-primary text-primary-foreground font-semibold";
const optionIdleClass = "border-border text-foreground hover:border-primary/40";

const fieldInputClass =
  "w-full border-0 border-b-2 border-foreground bg-transparent py-2.5 text-2xl outline-none placeholder:text-muted/50 sm:text-[28px]";

/**
 * Every step's fields stay mounted for the whole wizard (just hidden via CSS)
 * instead of being conditionally rendered — an unmounted input drops out of
 * the form's FormData entirely, which would silently lose earlier steps'
 * answers by the time the final step submits.
 */
function Step({ show, children }: { show: boolean; children: React.ReactNode }) {
  return <div className={show ? "" : "hidden"}>{children}</div>;
}

/** Must live inside the <form> to read its submit state. */
function PendingOverlay() {
  const { pending } = useFormStatus();
  return <LoadingOverlay active={pending} message="Setting up your workspace…" />;
}

export function OnboardingWizard({
  slug,
  fullName: initialName,
  professionalTitle,
  sessionType,
  location: initialLocation,
  timezone,
  suggestedHandle,
  handleChosen,
}: {
  slug: string;
  fullName: string;
  professionalTitle: string;
  sessionType: SessionType;
  location: string;
  timezone: string;
  suggestedHandle: string;
  handleChosen: boolean;
}) {
  const [step, setStep] = useState(0);
  // They land on a welcome first: set up the profile now (step 1), or skip to the portal.
  const [welcome, setWelcome] = useState(true);
  const nameInput = useRef<HTMLInputElement>(null);
  // The name clients see. The link suggested on the link step follows it until they type a link of their own.
  const [fullName, setFullName] = useState(initialName);
  const [handleEdited, setHandleEdited] = useState(false);
  const firstName = fullName.trim().split(" ")[0] || "there";
  // The record's slug changes when they choose a link, and the rest of the form still has to refer to it.
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [handle, setHandle] = useState(suggestedHandle);
  const [handleStatus, setHandleStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [claiming, startClaim] = useTransition();
  const handleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>(sessionType);
  const [location, setLocation] = useState(initialLocation);
  const [zone, setZone] = useState(timezone);
  const deviceZone = useDeviceTimeZone();
  // Until the full list is ready the dropdown knows just their own zone. Working out every zone's offset takes real time,
  // so it is done when the browser is idle, shortly after the page appears, not while the wizard is loading.
  const [zoneOptions, setZoneOptions] = useState(() => [{ value: timezone, label: `${timezone.replace(/_/g, " ")} (${offsetLabel(timezone)})` }]);
  useEffect(() => {
    const build = () => {
      const options = timeZoneOptions();
      // The saved zone is always in the list, even if the platform's own list somehow lacks it.
      setZoneOptions(options.some((o) => o.value === timezone) ? options : [{ value: timezone, label: timezone }, ...options]);
    };
    if (typeof requestIdleCallback === "function") {
      const handle = requestIdleCallback(build, { timeout: 2500 });
      return () => cancelIdleCallback(handle);
    }
    const handle = setTimeout(build, 600);
    return () => clearTimeout(handle);
  }, [timezone]);

  // The steps they will see: location is only asked for when they see clients in person. `step` counts through this list.
  const sequence = STEP_ORDER.filter((id) => id !== "location" || selectedSessionType !== "online");
  const total = sequence.length;
  const current: StepId | "done" = step >= total ? "done" : sequence[step];
  // Which ways of verifying are ticked, and the file for each. All of it posts with the form when they finish.
  const picker = useCredentialPicker();

  const next = () => setStep((s) => Math.min(s + 1, total));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Moving on from the name step: if they changed the name and haven't picked a link yet, suggest one that fits it.
  const continueFromName = () => {
    if (!fullName.trim()) return;
    if (handleChosen || handleEdited || fullName.trim() === initialName.trim()) {
      next();
      return;
    }
    startClaim(async () => {
      const suggestion = await suggestHandleAction(fullName);
      if (suggestion) {
        setHandle(suggestion);
        setHandleStatus(null);
      }
      next();
    });
  };

  // Moving on from the link step saves their choice first. Leaving it blank is fine if they haven't chosen one yet: they can
  // choose later. A link they already have can be changed here too, but not emptied.
  const continueFromHandle = () => {
    const wanted = handle.trim();
    if (!wanted && handleChosen) {
      setHandleStatus({ ok: false, message: "Your profile link can't be blank." });
      return;
    }
    if (!wanted || (handleChosen && wanted === currentSlug)) {
      next();
      return;
    }
    startClaim(async () => {
      const result = await claimHandleAction(wanted);
      if (!result.ok) {
        setHandleStatus({ ok: false, message: result.message });
        return;
      }
      setCurrentSlug(result.slug);
      setHandleStatus(null);
      next();
    });
  };

  const onHandleChange = (value: string) => {
    setHandleEdited(true);
    const cleaned = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-{2,}/g, "-");
    setHandle(cleaned);
    setHandleStatus(null);
    if (handleTimer.current) clearTimeout(handleTimer.current);
    if (!cleaned) return;
    handleTimer.current = setTimeout(async () => setHandleStatus(await checkHandleAction(cleaned)), 350);
  };

  const advanceOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (current === "name") continueFromName();
      else if (current === "link") continueFromHandle();
      else next();
    }
  };

  return (
    // The muted base the card floats on — deliberately a step deeper than the
    // card's own surfaces, so the card reads as a raised layout sitting above
    // the page, not as the page itself.
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4 sm:p-8 lg:p-12">
      <main className="flex h-[min(760px,92vh)] w-full max-w-6xl overflow-hidden rounded-[28px] ring-1 ring-black/[0.08] shadow-2xl">
        {/* Left panel is the photo alone, full-bleed — no text or logo over it. */}
        <aside className="relative hidden w-[420px] shrink-0 xl:w-[460px] bg-[#7d8556] lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local image, no optimization needed */}
          <img
            src="/brand/onboarding-left.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-[55%_50%]"
          />
        </aside>

        {/* Changing right panel — crisp white instead of the portal's usual
            oat page wash, so the form reads as a clean canvas against the
            left panel rather than two similarly-toned surfaces. */}
        <form
          action={finishOnboardingAction}
          className="flex min-w-0 flex-1 flex-col bg-surface"
          onKeyDown={(e) => {
            // Enter shouldn't submit the whole form early from an earlier step's input.
            if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && step < total - 1) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="slug" value={currentSlug} />
          <input type="hidden" name="sessionType" value={selectedSessionType} />
          <PendingOverlay />

          {/* Three fixed regions — header, step body, footer — so every step
              sits in the same frame and nothing needs a scrollbar. */}
          <header className="flex shrink-0 items-center justify-between px-6 pt-8 sm:px-14">
            {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed */}
            <img src="/brand/mentifylabs-logo.svg" alt={siteConfig.name} className="h-7 w-auto" />
            {/* Exits the whole flow, kept visually separate from the per-step Back/Continue pair below. */}
            {!welcome && current !== "done" && (
              <button
                type="submit"
                formAction={skipOnboardingAction}
                className="text-xs font-medium text-muted underline decoration-muted/40 underline-offset-4 transition hover:text-foreground"
              >
                Skip setup
              </button>
            )}
          </header>

          {!welcome && current !== "done" && (
            <div className="shrink-0 px-6 pt-7 sm:px-14">
              <div className="flex gap-1.5">
                {Array.from({ length: total }, (_, i) => (
                  <div key={i} className="h-[3px] flex-1 rounded-full bg-black/[0.08]">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: i < step ? "100%" : "0%" }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium tracking-wide text-muted uppercase">
                Step {step + 1} of {total}
              </p>
            </div>
          )}

          {/* Centred with auto margins rather than justify-center: when a step is taller than the screen it scrolls from its top, instead of being cut off above. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6 sm:px-14">
            <div className="my-auto w-full max-w-xl">
              {welcome && (
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Quick setup</p>
                  <h1 className="mt-4 text-[40px] leading-[1.08] font-semibold sm:text-[56px]">
                    Welcome, {firstName}.
                  </h1>
                  <p className="mt-7 max-w-md text-[17px] leading-relaxed text-muted">
                    Your public profile is how clients find and book you. A few short questions and it&apos;s started. You can
                    change any of it later.
                  </p>

                  <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        setWelcome(false);
                        requestAnimationFrame(() => nameInput.current?.focus());
                      }}
                      className="rounded-xl bg-primary px-8 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                    >
                      Set up my profile →
                    </button>
                    <button
                      type="submit"
                      formAction={skipOnboardingAction}
                      className="text-sm font-medium text-muted underline decoration-muted/40 underline-offset-4 transition hover:text-foreground"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              )}

              {/* The steps stay mounted while the welcome shows (just hidden), so no answer is ever dropped from the form. */}
              <div className={welcome ? "hidden" : ""}>
              <Step show={current === "name"}>
                <h1 className={headingClass}>What name goes on your public profile?</h1>
                <input
                  name="fullName"
                  ref={nameInput}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={advanceOnEnter}
                  autoFocus
                  maxLength={PUBLIC_NAME_MAX}
                  autoComplete="name"
                  aria-label="Your name"
                  placeholder="e.g. Dr. Ayesha Khan"
                  className={`mt-8 ${fieldInputClass}`}
                />
              </Step>

              <Step show={current === "title"}>
                <h1 className={headingClass}>What&apos;s your professional title?</h1>
                <input
                  name="professionalTitle"
                  defaultValue={professionalTitle}
                  onKeyDown={advanceOnEnter}
                  placeholder="e.g. Clinical Psychologist"
                  className={`mt-8 ${fieldInputClass}`}
                />
              </Step>






              <Step show={current === "mode"}>
                <h1 className={headingClass}>How do you see clients?</h1>
                <div className="mt-8 flex flex-col gap-3 sm:max-w-sm">
                  {SESSION_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selectedSessionType === value}
                      onClick={() => setSelectedSessionType(value)}
                      className={`${optionClass} px-5 py-4 text-base ${
                        selectedSessionType === value ? optionActiveClass : optionIdleClass
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Step>

              <Step show={current === "location"}>
                <h1 className={headingClass}>Where do you see clients in person?</h1>
                <input
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={advanceOnEnter}
                  maxLength={160}
                  autoComplete="off"
                  aria-label="Location"
                  placeholder="Clinic name, area, city"
                  className={`mt-8 ${fieldInputClass}`}
                />
              </Step>

              <Step show={current === "zone"}>
                <h1 className={headingClass}>What time zone are you in?</h1>
                {/* Our own dropdown, not the browser's: compact, in our colours, and its list is as wide as the button and short enough to stay above the footer. */}
                <div className="mt-8 w-full max-w-sm">
                  <ThemedSelect
                    name="timezone"
                    ariaLabel="Time zone"
                    value={zone}
                    onChange={setZone}
                    listMaxHeightClass="max-h-44"
                    options={zoneOptions}
                    triggerClassName="inline-flex w-full max-w-sm cursor-pointer items-center gap-3 rounded-lg bg-surface py-2.5 pr-3.5 pl-4 text-left text-sm font-medium ring-1 ring-black/[0.14] transition hover:bg-black/[0.03]"
                  />
                </div>
                {deviceZone && deviceZone !== zone && (
                  <p className="mt-3 text-sm text-muted">
                    This device is set to <span className="font-medium text-foreground">{deviceZone.replace(/_/g, " ")}</span>.{" "}
                    <button type="button" onClick={() => setZone(deviceZone)} className="font-medium text-primary hover:underline">
                      Use it
                    </button>
                  </p>
                )}
              </Step>


              <Step show={current === "link"}>
                <h1 className={headingClass}>Choose your profile link.</h1>
                <p className={subtitleClass}>
                  This is the address clients will use to find and book you.
                </p>
                <div className="mt-8 flex items-baseline gap-1 border-b-2 border-foreground">
                  <span className="shrink-0 text-xl text-muted sm:text-2xl">{siteConfig.url.replace(/^https?:\/\//, "")}/</span>
                  <input
                    value={handle}
                    onChange={(e) => onHandleChange(e.target.value)}
                    onKeyDown={advanceOnEnter}
                    disabled={claiming}
                    spellCheck={false}
                    autoCapitalize="none"
                    autoComplete="off"
                    aria-label="Profile link"
                    placeholder="your-name"
                    className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-xl font-medium outline-none placeholder:text-muted/50 sm:text-2xl"
                  />
                </div>
                <p className={`mt-3 text-sm ${handleStatus ? (handleStatus.ok ? "text-success" : "text-alert") : "text-muted"}`}>
                  {handleStatus ? handleStatus.message : "3 to 30 characters: lowercase letters, numbers and hyphens."}
                </p>
              </Step>

              <Step show={current === "credentials"}>
                <h1 className={headingClass}>Verify your credentials.</h1>
                <p className={subtitleClass}>
                  Tick the ways you can verify yourself and add a file for each. You can also do this later.
                </p>

                {/* Tall lists scroll inside the step, so this step stays the same height as the others. */}
                <div className="themed-scrollbar mt-6 max-h-[19rem] overflow-y-auto pr-1">
                  <CredentialPicker picker={picker} tone="wizard" />
                </div>
              </Step>

              <Step show={current === "done"}>
                <h1 className={headingClass}>You&apos;re set, {firstName}.</h1>
                <p className={subtitleClass}>
                  Your workspace is ready. Your dashboard has a short checklist for finishing your profile: photo, About me, services, hours and the rest.
                </p>
              </Step>
              </div>
            </div>
          </div>

          {!welcome && (
          <footer className="flex shrink-0 items-center justify-between border-t border-border px-6 py-6 sm:px-14">
            {step > 0 && current !== "done" ? (
              <button
                type="button"
                onClick={back}
                className="text-sm font-medium text-muted transition hover:text-foreground"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            {current !== "done" ? (
              <button
                type="button"
                onClick={current === "name" ? continueFromName : current === "link" ? continueFromHandle : next}
                disabled={claiming || (current === "name" && !fullName.trim()) || (current === "link" && handleStatus?.ok === false) || (current === "credentials" && (picker.incomplete || !!picker.problem))}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {claiming ? "Saving…" : "Continue →"}
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Go to dashboard →
              </button>
            )}
          </footer>
          )}
        </form>
      </main>
    </div>
  );
}
