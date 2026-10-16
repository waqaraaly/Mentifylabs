/** Small hex-colour helpers for the profile templates: mixing, contrast and picking a readable text colour. */

export const HEX = /^#[0-9a-f]{6}$/i;

function channels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("")}`;

/** `amount` of `a` mixed into `b` (0 gives b, 1 gives a). */
export function mix(a: string, b: string, amount: number): string {
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  return toHex(ar * amount + br * (1 - amount), ag * amount + bg * (1 - amount), ab * amount + bb * (1 - amount));
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Whichever of the two candidate colours reads better on `background`. */
export function readableOn(background: string, light = "#ffffff", dark = "#17140f"): string {
  return contrast(background, light) >= contrast(background, dark) ? light : dark;
}

export const darken = (hex: string, amount: number) => mix("#000000", hex, amount);
export const lighten = (hex: string, amount: number) => mix("#ffffff", hex, amount);
