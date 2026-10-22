import type { CSSProperties, ReactNode } from "react";
import { mix } from "@/lib/color";
import type { ResolvedDesign } from "@/lib/templates";
import type { ProfileModel } from "@/components/practitioner/templates/model";
import { About, Expertise, Journey, Services, type SectionId } from "@/components/practitioner/templates/parts";

export interface LayoutProps {
  m: ProfileModel;
  d: ResolvedDesign;
}

export const WRAP = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const TITLES = /^(dr|prof|professor|mr|mrs|ms|miss|mx|sir|sister|ustadh|hakim)\.?$/i;

/** The name someone would say aloud: the first word that is not a title, so "Dr. Amina Rahman" becomes "Amina". */
export const firstName = (m: ProfileModel) => {
  const words = m.practitioner.fullName.trim().split(/\s+/);
  return words.find((w) => !TITLES.test(w)) ?? words[0] ?? "";
};

export interface Block {
  id: Exclude<SectionId, "contact">;
  node: ReactNode;
}

/** The sections this profile actually has, in reading order. Empty ones are left out so no heading ever stands over nothing. */
export function blocks(m: ProfileModel, d: ResolvedDesign): Block[] {
  const { spec } = d;
  const list: Block[] = [];
  if (m.paragraphs.length) list.push({ id: "about", node: <About m={m} /> });
  if (m.expertise.length) list.push({ id: "expertise", node: <Expertise items={m.expertise} variant={spec.expertise} /> });
  if (m.services.length) list.push({ id: "services", node: <Services items={m.services} variant={spec.services} /> });
  if (m.education.length || m.experience.length) list.push({ id: "journey", node: <Journey m={m} variant={spec.journey} /> });
  return list;
}

/**
 * Text on a coloured panel is read against the panel, not the page, so the panel carries its own text colours, and the
 * pieces inside it (pills, links, icons) pick them up through the same variables.
 */
export function toneStyle(d: ResolvedDesign, which?: "accent"): CSSProperties {
  const tone = which === "accent" ? d.vars["--pt-accent"] : d.vars["--pt-tone"];
  const on = which === "accent" ? d.vars["--pt-accent-foreground"] : d.vars["--pt-tone-foreground"];
  return {
    background: tone,
    color: on,
    "--pt-text": on,
    "--pt-muted": mix(on, tone, 0.74),
    "--pt-tagline": mix(on, tone, 0.9),
    "--pt-border": mix(on, tone, 0.26),
    "--pt-tint": mix(on, tone, 0.12),
    "--pt-tint-strong": mix(on, tone, 0.2),
    "--pt-accent-text": on,
    "--pt-accent": on,
    "--pt-accent-foreground": tone,
    "--pt-ok": mix("#4ade80", on, 0.8),
  } as CSSProperties;
}

/** Puts the page's own colours back for a card that sits inside a coloured panel (the panel has re-pointed the text colours). */
export function pageStyle(d: ResolvedDesign): CSSProperties {
  const keys = ["--pt-text", "--pt-muted", "--pt-tagline", "--pt-border", "--pt-tint", "--pt-tint-strong", "--pt-accent-text", "--pt-accent", "--pt-accent-hover", "--pt-accent-foreground", "--pt-ok"];
  return { color: d.vars["--pt-text"], ...Object.fromEntries(keys.map((k) => [k, d.vars[k]])) } as CSSProperties;
}
