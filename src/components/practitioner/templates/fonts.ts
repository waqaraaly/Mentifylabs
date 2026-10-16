import {
  Bodoni_Moda,
  Bricolage_Grotesque,
  Caveat,
  Cormorant_Garamond,
  DM_Sans,
  DM_Serif_Display,
  Figtree,
  Instrument_Serif,
  Lora,
  Manrope,
  Newsreader,
  Playfair_Display,
  Space_Grotesk,
  Syne,
  Young_Serif,
} from "next/font/google";

// Fraunces, Inter and Geist Mono come from the root layout. These are the extra faces the templates use. None of them
// preloads: a profile only downloads the files for the faces it actually draws, so a template never costs another
// template's fonts.

const instrument = Instrument_Serif({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-instrument", weight: "400", style: ["normal", "italic"] });
const dmserif = DM_Serif_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-dmserif", weight: "400", style: ["normal", "italic"] });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-playfair", style: ["normal", "italic"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-cormorant", weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });
const newsreader = Newsreader({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-newsreader", style: ["normal", "italic"] });
const young = Young_Serif({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-young", weight: "400" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-bricolage" });
const syne = Syne({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-syne" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-bodoni", style: ["normal", "italic"] });
const space = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-space" });
const dmsans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-dmsans", style: ["normal", "italic"] });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-manrope" });
const figtree = Figtree({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-figtree", style: ["normal", "italic"] });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-lora", style: ["normal", "italic"] });
const caveat = Caveat({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-caveat" });

/** Put on the element that carries a template, so its font variables exist for everything inside. */
export const TEMPLATE_FONT_CLASSES = [instrument, dmserif, playfair, cormorant, newsreader, young, bricolage, syne, bodoni, space, dmsans, manrope, figtree, lora, caveat]
  .map((font) => font.variable)
  .join(" ");
