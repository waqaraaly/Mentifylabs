"use client";

import { type KeyboardEvent, useState } from "react";
import { useFormStatus } from "react-dom";
import { Paperclip } from "lucide-react";
import { EditableList } from "@/components/portal/EditableList";
import { LoadingOverlay } from "@/components/ui/BrainLoader";
import { formatFileSize } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { DOCUMENT_CATEGORIES } from "@/types/document";
import type { SessionType } from "@/types/practitioner";
import { finishOnboardingAction, skipOnboardingAction } from "./actions";

const SESSION_OPTIONS: { value: SessionType; label: string }[] = [
  { value: "online", label: "Online sessions" },
  { value: "offline", label: "In person" },
  { value: "both", label: "Both" },
];

const STEP_COUNT = 6;

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
  firstName,
  professionalTitle,
  shortBio,
  specializations,
  sessionType,
  feeMin,
  feeMax,
}: {
  slug: string;
  firstName: string;
  professionalTitle: string;
  shortBio: string;
  specializations: string[];
  sessionType: SessionType;
  feeMin: number;
  feeMax: number;
}) {
  const [step, setStep] = useState(0);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>(sessionType);
  const [category, setCategory] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);

  const next = () => setStep((s) => Math.min(s + 1, STEP_COUNT));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const advanceOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      next();
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
            if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && step < STEP_COUNT - 1) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="sessionType" value={selectedSessionType} />
          <input type="hidden" name="verificationCategory" value={category} />
          <PendingOverlay />

          {/* Three fixed regions — header, step body, footer — so every step
              sits in the same frame and nothing needs a scrollbar. */}
          <header className="flex shrink-0 items-center justify-between px-6 pt-8 sm:px-14">
            {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed */}
            <img src="/brand/mentifylabs-logo.svg" alt={siteConfig.name} className="h-7 w-auto" />
            {/* Exits the whole flow, kept visually separate from the per-step Back/Continue pair below. */}
            {step < STEP_COUNT && (
              <button
                type="submit"
                formAction={skipOnboardingAction}
                className="text-xs font-medium text-muted underline decoration-muted/40 underline-offset-4 transition hover:text-foreground"
              >
                Skip setup
              </button>
            )}
          </header>

          {step < STEP_COUNT && (
            <div className="shrink-0 px-6 pt-7 sm:px-14">
              <div className="flex gap-1.5">
                {Array.from({ length: STEP_COUNT }, (_, i) => (
                  <div key={i} className="h-[3px] flex-1 rounded-full bg-black/[0.08]">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: i < step ? "100%" : "0%" }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium tracking-wide text-muted uppercase">
                Step {step + 1} of {STEP_COUNT}
              </p>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-6 sm:px-14">
            <div className="w-full max-w-xl">
              <Step show={step === 0}>
                <h1 className={headingClass}>What&apos;s your professional title?</h1>
                <input
                  name="professionalTitle"
                  defaultValue={professionalTitle}
                  onKeyDown={advanceOnEnter}
                  autoFocus
                  placeholder="e.g. Clinical Psychologist"
                  className={`mt-8 ${fieldInputClass}`}
                />
              </Step>

              <Step show={step === 1}>
                <h1 className={headingClass}>Sum yourself up in one line.</h1>
                <input
                  name="shortBio"
                  defaultValue={shortBio}
                  onKeyDown={advanceOnEnter}
                  placeholder="Helping clients build calmer daily routines"
                  className={`mt-8 ${fieldInputClass}`}
                />
              </Step>

              <Step show={step === 2}>
                <h1 className={headingClass}>What do you help with?</h1>
                <div className="mt-8">
                  <EditableList
                    name="specializations"
                    initialItems={specializations}
                    placeholder="e.g. Anxiety"
                    chipClassName="bg-primary/[0.1] text-primary"
                  />
                </div>
              </Step>

              <Step show={step === 3}>
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

              <Step show={step === 4}>
                <h1 className={headingClass}>What do you charge?</h1>
                <p className={subtitleClass}>In PKR, per session. You can leave this for now.</p>
                <div className="mt-8 grid grid-cols-2 gap-8 sm:max-w-sm">
                  <div>
                    <label htmlFor="feeMin" className="text-sm text-muted">
                      Minimum
                    </label>
                    <input
                      id="feeMin"
                      name="feeMin"
                      type="number"
                      min={0}
                      defaultValue={feeMin || ""}
                      onKeyDown={advanceOnEnter}
                      className={fieldInputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="feeMax" className="text-sm text-muted">
                      Maximum
                    </label>
                    <input
                      id="feeMax"
                      name="feeMax"
                      type="number"
                      min={0}
                      defaultValue={feeMax || ""}
                      onKeyDown={advanceOnEnter}
                      className={fieldInputClass}
                    />
                  </div>
                </div>
              </Step>

              <Step show={step === 5}>
                <h1 className={headingClass}>Verify your credentials.</h1>
                <p className={subtitleClass}>
                  Upload a degree, license or certification so clients see you&apos;re verified.
                </p>

                {/* Compact on purpose: a 2×2 grid plus a single file row keeps
                    this step the same height as the others. */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={category === c}
                      onClick={() => setCategory(c)}
                      className={`${optionClass} px-4 py-3 text-sm ${category === c ? optionActiveClass : optionIdleClass}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <label
                  htmlFor="verificationFile"
                  className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-border px-4 py-3.5 text-sm transition focus-within:border-primary hover:border-primary/40 hover:bg-black/[0.02]"
                >
                  <Paperclip className="size-4 shrink-0 text-muted" aria-hidden />
                  {fileName ? (
                    <span className="min-w-0 flex-1 truncate">
                      {fileName}
                      {fileSize ? <span className="text-muted"> · {formatFileSize(fileSize)}</span> : null}
                    </span>
                  ) : (
                    <span className="text-muted">Choose a file — PDF, JPG, PNG or WebP</span>
                  )}
                </label>
                <input
                  id="verificationFile"
                  name="verificationFile"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setFileName(file?.name ?? null);
                    setFileSize(file?.size);
                  }}
                />
              </Step>

              <Step show={step === STEP_COUNT}>
                <h1 className={headingClass}>You&apos;re set, {firstName}.</h1>
                <p className={subtitleClass}>
                  Your workspace is ready. You can refine your public profile any time from Settings.
                </p>
              </Step>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-between border-t border-border px-6 py-6 sm:px-14">
            {step > 0 && step < STEP_COUNT ? (
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
            {step < STEP_COUNT ? (
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Continue →
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
        </form>
      </main>
    </div>
  );
}
