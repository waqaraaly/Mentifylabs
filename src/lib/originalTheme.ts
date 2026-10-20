import { contrast, darken, mix, readableOn } from "@/lib/color";
import type { Palette } from "@/lib/templates";

/**
 * The original design is coloured by CSS variables written out by hand for each of its colour themes (see globals.css).
 * This writes the same set from a colour scheme's palette, so the original can be offered the same schemes the layouts
 * use. Set on the page's root, it replaces the colour theme's values.
 */
export function originalThemeVars(p: Palette): Record<string, string> {
  const { bg, ink, accent, alt } = p;
  const border = mix(ink, bg, p.dark ? 0.18 : 0.12);
  // The Reach Out card: the accent when white reads on it, a deeper accent otherwise, and the tint on a dark page.
  const card = p.dark
    ? alt
    : contrast(accent, "#ffffff") >= 4.5
      ? accent
      : darken(accent, 0.4);
  const onCard = p.dark ? ink : readableOn(card);
  const hover = darken(accent, 0.14);
  const tile = Object.fromEntries(
    [1, 2, 3, 4, 5].flatMap((n) => [
      [`--pt-tile-${n}`, accent],
      [`--pt-tile-${n}-hover`, hover],
    ]),
  );

  return {
    "--pt-outer": alt,
    // Set as well, so a colour theme's own values for these never show through.
    "--pt-ring": alt,
    "--pt-marker": mix(accent, bg, p.dark ? 0.35 : 0.25),
    "--pt-timeline": mix(ink, bg, 0.25),
    "--pt-bg": bg,
    "--pt-surface": p.surface,
    "--pt-text": ink,
    "--pt-tagline": mix(ink, bg, 0.84),
    "--pt-muted": mix(ink, bg, 0.64),
    "--pt-muted-light": mix(onCard, card, 0.88),
    "--pt-accent": accent,
    "--pt-accent-hover": hover,
    "--pt-accent-light": onCard,
    "--pt-accent-foreground": readableOn(accent),
    "--pt-tint2": mix(accent, bg, 0.1),
    "--pt-border": border,
    "--pt-dark-card": card,
    "--pt-dark-divider": mix(onCard, card, 0.22),
    "--pt-dark-card-foreground": onCard,
    "--pt-dark-card-border": card,
    "--pt-dark-card-shadow": mix(card, "#000000", 0.4),
    "--pt-icon-fill": mix(onCard, card, 0.12),
    "--pt-icon-border": mix(onCard, card, 0.4),
    "--pt-tile-border": accent,
    "--pt-modal-sidebar": accent,
    "--pt-toggle-track": "transparent",
    "--pt-toggle-border": ink,
    "--pt-input-bg": mix(ink, bg, 0.05),
    "--pt-input-border": border,
    "--pt-tile-fg": readableOn(accent),
    "--pt-tile-ring": "transparent",
    ...tile,
  };
}
