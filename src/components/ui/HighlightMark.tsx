/**
 * A marker swipe behind the lower part of a heading, a little tilted, with soft, uneven corners. Put it inside a heading
 * that is `relative isolate inline-block`, so it sits behind the words. Its colour is the theme's `--pt-marker`, and a theme
 * that does not set one gets a soft mix of its own frame and accent colours, so the marker always belongs to the theme.
 */
export function HighlightMark() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-x-[0.12em] bottom-[0.02em] -z-10 h-[0.42em] -rotate-[0.8deg] rounded-[3px_8px_4px_9px/6px_4px_7px_5px] bg-(--pt-marker,color-mix(in_srgb,var(--pt-outer)_80%,var(--pt-accent)))"
    />
  );
}
