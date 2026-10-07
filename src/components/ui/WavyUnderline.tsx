/** The hand-drawn wave under a heading. It takes the public profile's accent by default; pass `color` outside a profile. */
export function WavyUnderline({ className = "", color }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 220 12" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        d="M0,6 C18,0 28,12 46,6 C64,0 74,12 92,6 C110,0 120,12 138,6 C156,0 166,12 184,6 C202,0 212,12 220,6"
        fill="none"
        stroke={color ?? "var(--pt-wave, var(--pt-accent))"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
