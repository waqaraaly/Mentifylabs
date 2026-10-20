import type { CSSProperties } from "react";
import type { LayoutId } from "@/lib/templates";

/**
 * A wireframe of a layout: grey blocks in the page's real proportions, with colour only on the booking button. It shows
 * how the page is organised and nothing else, so it never changes with the colours, fonts or details chosen. Positions
 * are percentages of the card, so it scales to any size.
 */

const PAGE = "var(--surface)";
const SOFT = "color-mix(in srgb, var(--primary) 9%, var(--surface))";
const MID = "color-mix(in srgb, var(--primary) 24%, var(--surface))";
const DARK = "color-mix(in srgb, var(--primary) 58%, var(--surface))";
const ACCENT = "var(--primary)";
const OUTLINE = `inset 0 0 0 1px ${MID}`;

function Block({
  x,
  y,
  w,
  h,
  fill = "transparent",
  round = "1.4cqw",
  outline = false,
  style,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  round?: string;
  outline?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className="absolute block"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        background: fill,
        borderRadius: round,
        boxShadow: outline ? OUTLINE : undefined,
        ...style,
      }}
    />
  );
}

function Dot({
  x,
  y,
  d,
  fill = MID,
}: {
  x: number;
  y: number;
  d: number;
  fill?: string;
}) {
  return (
    <span
      aria-hidden
      className="absolute block rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${d}%`,
        aspectRatio: "1",
        background: fill,
      }}
    />
  );
}

/** Lines of text: the last one shorter. */
function Lines({
  x,
  y,
  w,
  n,
  gap = 4.2,
  fill = MID,
}: {
  x: number;
  y: number;
  w: number;
  n: number;
  gap?: number;
  fill?: string;
}) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <Block
          key={i}
          x={x}
          y={y + i * gap}
          w={i === n - 1 ? w * 0.65 : w}
          h={2}
          fill={fill}
          round="99px"
        />
      ))}
    </>
  );
}

/** The first layout: a framed page with a menu bar, the photo beside the introduction, tiles, text and a closing card. */
function Framed() {
  return (
    <>
      <Block x={0} y={0} w={100} h={100} fill={SOFT} round="0" />
      <Block x={4} y={3} w={92} h={97} fill={PAGE} round="4cqw 4cqw 0 0" />
      <Block x={9} y={8} w={22} h={2.6} fill={MID} round="99px" />
      <Block x={70} y={7} w={21} h={4.4} fill={ACCENT} round="99px" />
      <Dot x={9} y={19} d={26} />
      <Block x={42} y={21} w={44} h={4.5} fill={DARK} round="99px" />
      <Lines x={42} y={30} w={44} n={3} />
      {[0, 1, 2].map((i) => (
        <Block key={i} x={9 + i * 29.5} y={50} w={26} h={10} fill={SOFT} />
      ))}
      <Lines x={9} y={66} w={82} n={3} />
      <Block x={9} y={82} w={82} h={12} fill={MID} />
    </>
  );
}

/** The second layout: a profile card across the top, content cards below it, and a booking card kept beside them. */
function Rail() {
  return (
    <>
      <Block
        x={0}
        y={0}
        w={100}
        h={100}
        fill={SOFT}
        round="0"
        style={{ opacity: 0.55 }}
      />
      <Block x={6} y={6} w={88} h={24} fill={PAGE} outline />
      <Dot x={10} y={10} d={15} />
      <Block x={29} y={11} w={38} h={3.4} fill={DARK} round="99px" />
      <Lines x={29} y={18} w={38} n={2} />
      <Block x={6} y={35} w={54} h={18} fill={PAGE} outline />
      <Block x={6} y={57} w={54} h={18} fill={PAGE} outline />
      <Block x={6} y={79} w={54} h={15} fill={PAGE} outline />
      <Block x={64} y={35} w={30} h={33} fill={PAGE} outline />
      <Block x={68} y={39} w={22} h={3} fill={MID} round="99px" />
      <Block x={68} y={46} w={22} h={5} fill={SOFT} />
      <Block x={68} y={53} w={22} h={5} fill={SOFT} />
      <Block x={68} y={61} w={22} h={5} fill={ACCENT} />
    </>
  );
}

/** The third layout: the profile fixed down the left, and a card for each thing on the right. */
function Sidebar() {
  return (
    <>
      <Dot x={8} y={10} d={17} />
      <Block x={8} y={31} w={24} h={3} fill={DARK} round="99px" />
      <Lines x={8} y={38} w={24} n={2} />
      {[0, 1, 2].map((i) => (
        <Dot key={i} x={8 + i * 8.5} y={50} d={6.5} fill={SOFT} />
      ))}
      <Block x={8} y={62} w={24} h={5} fill={ACCENT} />
      <Block x={42} y={8} w={50} h={20} fill={PAGE} outline />
      <Block x={42} y={31} w={50} h={14} fill={PAGE} outline />
      <Block x={42} y={48} w={50} h={14} fill={PAGE} outline />
      <Block x={42} y={65} w={50} h={14} fill={PAGE} outline />
      <Block x={42} y={82} w={50} h={12} fill={PAGE} outline />
    </>
  );
}

const ART: Record<LayoutId | "original", () => React.JSX.Element> = {
  original: Framed,
  "rail-card": Rail,
  "link-page": Sidebar,
};

export function TemplateThumb({
  id,
  className = "",
}: {
  id: LayoutId | "original";
  className?: string;
}) {
  const Art = ART[id];
  return (
    <div
      aria-hidden
      className={`@container relative aspect-[4/5] overflow-hidden bg-surface ${className}`}
    >
      <Art />
    </div>
  );
}
