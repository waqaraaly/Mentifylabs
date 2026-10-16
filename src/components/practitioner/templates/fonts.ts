import {
  Atkinson_Hyperlegible_Next,
  Instrument_Sans,
  Instrument_Serif,
  Lexend,
  Newsreader,
  Nunito,
  Nunito_Sans,
  Plus_Jakarta_Sans,
  Public_Sans,
  Source_Sans_3,
  Source_Serif_4,
} from "next/font/google";

// Fraunces and Inter come from the root layout. These are the extra faces the typeface choices use. None of them
// preloads: a profile only downloads the files for the faces it actually draws.

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-jakarta" });
const lexend = Lexend({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-lexend" });
const source = Source_Sans_3({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-source" });
const sourceserif = Source_Serif_4({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-sourceserif" });
const atkinson = Atkinson_Hyperlegible_Next({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-atkinson" });
const nunito = Nunito({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-nunito" });
const nunitosans = Nunito_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-nunitosans" });
const publicsans = Public_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-public" });
const newsreader = Newsreader({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-newsreader", style: ["normal", "italic"] });
const instrument = Instrument_Serif({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-instrument", weight: "400", style: ["normal", "italic"] });
const instrsans = Instrument_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-instrsans" });

/** Put on the element that carries a profile design, so its font variables exist for everything inside. */
export const TEMPLATE_FONT_CLASSES = [jakarta, lexend, source, sourceserif, atkinson, nunito, nunitosans, publicsans, newsreader, instrument, instrsans]
  .map((font) => font.variable)
  .join(" ");
