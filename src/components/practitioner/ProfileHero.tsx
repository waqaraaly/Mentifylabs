import type { ReactNode } from "react";
import type { Practitioner } from "@/types/practitioner";
import { WavyUnderline } from "@/components/ui/WavyUnderline";
import { formatFeeAmounts, hasFeeRange } from "@/lib/fees";

const SESSION_MODE_LABEL: Record<Practitioner["sessionType"], string> = {
  online: "Online",
  offline: "On-Site",
  both: "Online, On-Site",
};

// A solid accent-colored circle with a checkmark in --pt-accent-foreground
// (white for the darker accents, dark ink for pale ones like Golden Hour),
// matching the reference design's verified badge exactly.
function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="var(--pt-accent)" />
      <path
        d="M7 12.5 10.2 15.5 17 8.5"
        fill="none"
        stroke="var(--pt-accent-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A custom dark tooltip (bg-(--pt-text)/bg-(--pt-bg), so it's legible in
// every color theme) instead of the browser's plain native `title`
// tooltip — pure CSS group-hover/group-focus, no JS state needed.
function VerifiedTooltip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span tabIndex={0} className="group relative inline-flex outline-none" aria-label={label}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-2.5 left-1/2 z-20 w-max -translate-x-1/2 -translate-y-full rounded-lg bg-(--pt-text) px-3 py-1.5 text-xs font-medium whitespace-nowrap text-(--pt-bg) opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-(--pt-text)" />
      </span>
    </span>
  );
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// A plain editorial hero — organic-blob portrait in a sage-green frame next
// to name/title/tagline and a quiet three-stat row, matching the reference
// design's exact colors and blob geometry.
export function ProfileHero({ practitioner }: { practitioner: Practitioner }) {
  const isVerified = practitioner.verificationStatus === "verified";

  const tagline =
    practitioner.shortBio ||
    (practitioner.specializations.length > 0
      ? `Specializing in ${practitioner.specializations.slice(0, 2).join(" and ").toLowerCase()}.`
      : practitioner.professionalTitle);

  const nameParts = practitioner.fullName.split(" ");
  const lastName = nameParts.pop();
  const firstNames = nameParts.join(" ");

  // The reference's exact organic-blob radius, on both the offset backdrop
  // and the photo itself.
  const blobRadius = "60% 40% 30% 70% / 55% 45% 65% 35%";

  return (
    <div className="mx-auto max-w-5xl px-[5.1px] pt-14 sm:px-[10.2px] sm:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,325px)_1fr]">
        <div className="relative mx-auto w-full max-w-[300px] lg:mx-0">
          {/* Backdrop blob — a uniform ring wrapping the whole photo
              (~15.4px, matching the reference layout), rather than an
              offset shape peeking from one corner. */}
          <div
            className="absolute -top-[15.4px] -right-[15.4px] -bottom-[15.4px] -left-[15.4px]"
            style={{ background: "var(--pt-outer)", borderRadius: blobRadius }}
            aria-hidden
          />
          <div
            className="relative aspect-[4/5] w-full overflow-hidden shadow-[0_24px_48px_-20px_rgba(32,34,31,0.3)]"
            style={{ borderRadius: blobRadius }}
          >
            {practitioner.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={practitioner.photoUrl}
                alt={`Portrait of ${practitioner.fullName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                role="img"
                aria-label={`${practitioner.fullName}'s portrait`}
                className="flex h-full w-full items-center justify-center bg-white font-serif text-5xl text-(--pt-accent)"
              >
                {getInitials(practitioner.fullName)}
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="flex flex-wrap items-center gap-3.5 text-4xl leading-[1.08] font-bold text-(--pt-text) sm:text-5xl">
            {firstNames && <span>{firstNames} </span>}
            <span className="relative inline-block">
              {lastName}
              <WavyUnderline className="absolute inset-x-0 -bottom-2 h-2.5 w-full" />
            </span>
            {isVerified && (
              <VerifiedTooltip label="Verified practitioner">
                <VerifiedBadge className="size-7 shrink-0" />
              </VerifiedTooltip>
            )}
          </h1>

          <p className="mt-6 text-lg font-medium text-(--pt-muted)">{practitioner.professionalTitle}</p>
          <p className="mt-5 max-w-xl text-[19px] leading-relaxed text-(--pt-tagline)">{tagline}</p>

          <div className="mt-8 flex max-w-xl flex-wrap gap-x-12 gap-y-6 border-t border-(--pt-border) pt-7">
            <div>
              <p className="text-xs tracking-[0.1em] text-(--pt-muted) uppercase">Experience</p>
              <p className="mt-2.5 text-xl text-(--pt-text)">{practitioner.experienceYears} Years</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.1em] text-(--pt-muted) uppercase">
                Fee range
                {hasFeeRange(practitioner.feeRange) && practitioner.feeRange.currency && ` (${practitioner.feeRange.currency})`}
              </p>
              <p className="mt-2.5 text-xl text-(--pt-text)">{formatFeeAmounts(practitioner.feeRange) ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.1em] text-(--pt-muted) uppercase">Session mode</p>
              <p className="mt-2.5 text-xl text-(--pt-text)">{SESSION_MODE_LABEL[practitioner.sessionType]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
