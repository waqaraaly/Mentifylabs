import type { CSSProperties, ReactNode } from "react";
import { mix } from "@/lib/color";
import { resolveDesign, type Palette, type PhotoShape, type ProfileStyle, type TemplateId } from "@/lib/templates";
import { SHAPE_STYLE } from "@/components/practitioner/templates/parts";


interface Ctx {
  p: Palette;
  ink: string;
  soft: string;
  faint: string;
  photoBg: string;
  shape: PhotoShape;
  scale: number;
}

function Bar({ t, w, h = 1.7, c, className = "" }: { t: Ctx; w: number | string; h?: number; c?: string; className?: string }) {
  return <span className={`block rounded-full ${className}`} style={{ width: typeof w === "number" ? `${w}%` : w, height: `${h}cqw`, background: c ?? t.faint }} />;
}

function Photo({ t, w, extra }: { t: Ctx; w: string; extra?: CSSProperties }) {
  const s = SHAPE_STYLE[t.shape];
  return (
    <span className="relative block shrink-0 overflow-hidden" style={{ width: w, aspectRatio: s.aspect, borderRadius: s.radius.replace("var(--pt-photo-r, 28px)", "12%"), background: t.photoBg, ...extra }}>
      <span className="absolute top-[24%] left-1/2 block aspect-square w-[34%] -translate-x-1/2 rounded-full" style={{ background: mix(t.ink, t.photoBg, 0.35) }} />
      <span className="absolute top-[56%] left-1/2 block aspect-[5/3] w-[70%] -translate-x-1/2 rounded-t-full" style={{ background: mix(t.ink, t.photoBg, 0.35) }} />
    </span>
  );
}

function Name({ t, size, lines = 1, color, align = "left" }: { t: Ctx; size: number; lines?: number; color?: string; align?: "left" | "center" }) {
  return (
    <span className="pt-display block leading-[1.02]" style={{ fontSize: `${size * t.scale}cqw`, color: color ?? t.ink, textAlign: align }}>
      Amina{lines === 2 ? <br /> : " "}Rahman
    </span>
  );
}

function Pill({ t, c, w = 22 }: { t: Ctx; c?: string; w?: number }) {
  return <span className="block rounded-full" style={{ width: `${w}cqw`, height: "4.6cqw", background: c ?? t.p.accent }} />;
}

/**
 * A small drawing of a template: its hero composition, palette, photo shape and typeface, with a hint of how the page
 * below is arranged. It is drawn from the same recipe the real page uses (resolveDesign), so it follows the
 * practitioner's accent, typeface and shape choices as they make them. Sizes are in container units, so it scales to any card.
 */
export function TemplateThumb({ id, style, className = "" }: { id: TemplateId; style?: ProfileStyle; className?: string }) {
  const d = resolveDesign(id, style);
  const { palette: p, spec, shape } = d;
  const ink = p.ink;
  const soft = mix(ink, p.bg, 0.16);
  const faint = mix(ink, p.bg, 0.3);
  const photoBg = mix(p.accent, p.bg, 0.3);
  const altOn = d.vars["--pt-alt-foreground"];

  const t: Ctx = { p, ink, soft, faint, photoBg, shape, scale: Number(d.vars["--pt-ds"]) };
  const spec_scale = t.scale;

  let hero: ReactNode;
  switch (spec.hero) {
    case "split": {
      const flip = Boolean(spec.flip);
      hero = (
        <div className={`flex items-center gap-[7cqw] px-[8cqw] pt-[9cqw] ${flip ? "flex-row-reverse" : ""}`}>
          <Photo t={t} w="38cqw" />
          <div className="flex min-w-0 flex-1 flex-col gap-[2.2cqw]">
            <Bar t={t} w={36} c={p.accent} h={1.3} />
            <Name t={t} size={8.5} lines={2} />
            <Bar t={t} w={90} />
            <Bar t={t} w={64} />
            <div className="mt-[1cqw]"><Pill t={t} /></div>
          </div>
        </div>
      );
      break;
    }
    case "center":
      hero = (
        <div className="flex flex-col items-center gap-[2.2cqw] px-[10cqw] pt-[8cqw]">
          <Photo t={t} w="27cqw" />
          <Bar t={t} w={22} c={p.accent} h={1.3} />
          <Name t={t} size={9.5} align="center" />
          <Bar t={t} w={70} />
          <Bar t={t} w={50} />
          <Pill t={t} />
        </div>
      );
      break;
    case "band":
      hero = (
        <div>
          <div className="h-[22cqw]" style={{ background: p.alt }} />
          <div className="-mt-[10cqw] flex gap-[6cqw] px-[8cqw]">
            <Photo t={t} w="27cqw" extra={{ boxShadow: `0 0 0 1.6cqw ${p.bg}` }} />
            <div className="flex flex-1 flex-col gap-[2.2cqw] pt-[12cqw]">
              <Bar t={t} w={36} c={p.accent} h={1.3} />
              <Name t={t} size={8.5} />
              <Bar t={t} w={90} />
              <Pill t={t} />
            </div>
          </div>
        </div>
      );
      break;
    case "masthead":
      hero = (
        <div className="px-[8cqw] pt-[6cqw]">
          <div className="h-px w-full" style={{ background: ink }} />
          <span className="pt-display mt-[3cqw] block leading-[0.9]" style={{ fontSize: `${15 * spec_scale}cqw` }}>
            Amina<br />Rahman<span style={{ color: p.accent }}>.</span>
          </span>
          <div className="mt-[3.5cqw] flex gap-[5cqw] border-t pt-[3.5cqw]" style={{ borderColor: ink }}>
            <Photo t={t} w="26cqw" />
            <div className="flex flex-1 flex-col gap-[2cqw]">
              <Bar t={t} w={95} h={2.4} c={soft} />
              <Bar t={t} w={70} h={2.4} c={soft} />
              <Bar t={t} w={50} />
              <div className="mt-[1cqw]"><Pill t={t} /></div>
            </div>
          </div>
        </div>
      );
      break;
    case "poster": {
      const flip = Boolean(spec.flip);
      hero = (
        <div className={`flex h-[52cqw] ${flip ? "flex-row-reverse" : ""}`}>
          <div className="relative w-1/2" style={{ background: photoBg }}>
            <span className="absolute left-1/2 top-[22%] block aspect-square w-[36%] -translate-x-1/2 rounded-full" style={{ background: mix(ink, photoBg, 0.35) }} />
            <span className="absolute left-1/2 top-[52%] block aspect-[5/3] w-[74%] -translate-x-1/2 rounded-t-full" style={{ background: mix(ink, photoBg, 0.35) }} />
          </div>
          <div className="flex w-1/2 flex-col justify-center gap-[2.2cqw] px-[5cqw]" style={{ background: p.alt, color: altOn }}>
            <Bar t={t} w={40} c={altOn} h={1.1} className="opacity-60" />
            <Name t={t} size={8.5} lines={2} color={altOn} />
            <Bar t={t} w={90} c={altOn} className="opacity-40" />
            <Bar t={t} w={60} c={altOn} className="opacity-40" />
            <Pill t={t} c={altOn} w={20} />
          </div>
        </div>
      );
      break;
    }
    case "card":
      hero = (
        <div>
          <div className="px-[8cqw] pt-[8cqw] pb-[13cqw]" style={{ background: p.alt }}>
            <div className="flex items-center gap-[6cqw] rounded-[3cqw] p-[5cqw]" style={{ background: p.surface, boxShadow: "0 3cqw 6cqw -3cqw rgba(0,0,0,.35)" }}>
              <Photo t={t} w="25cqw" />
              <div className="flex flex-1 flex-col gap-[2cqw]">
                <Bar t={t} w={40} c={p.accent} h={1.2} />
                <Name t={t} size={8} lines={2} />
                <Bar t={t} w={85} />
                <Pill t={t} w={19} />
              </div>
            </div>
          </div>
          <div className="-mt-[6cqw] flex gap-[2.5cqw] px-[11cqw]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="block h-[9cqw] flex-1 rounded-[1.6cqw]" style={{ background: p.surface, boxShadow: `inset 0 0 0 1px ${soft}` }} />
            ))}
          </div>
        </div>
      );
      break;
  }

  let body: ReactNode;
  switch (spec.body) {
    case "flow":
      body = (
        <div className="flex flex-col gap-[2cqw] px-[8cqw]">
          <Bar t={t} w={34} h={3} c={ink} />
          <Bar t={t} w={92} />
          <Bar t={t} w={78} />
          <div className="mt-[1.5cqw] flex gap-[2cqw]">
            {[18, 24, 16].map((w, i) => (
              <span key={i} className="block h-[5cqw] rounded-full" style={{ width: `${w}cqw`, background: mix(p.accent, p.bg, 0.16), boxShadow: `inset 0 0 0 1px ${soft}` }} />
            ))}
          </div>
        </div>
      );
      break;
    case "rail":
      body = (
        <div className="flex gap-[5cqw] px-[8cqw]">
          <span className="block h-[22cqw] w-[26cqw] rounded-[2cqw]" style={{ background: p.accent }} />
          <div className="flex flex-1 flex-col gap-[2cqw]">
            <Bar t={t} w={50} h={3} c={ink} />
            <Bar t={t} w={95} />
            <Bar t={t} w={80} />
            <Bar t={t} w={60} />
          </div>
        </div>
      );
      break;
    case "bento":
      body = (
        <div className="grid grid-cols-6 gap-[2cqw] px-[8cqw]">
          <span className="col-span-4 block h-[14cqw] rounded-[2cqw]" style={{ background: p.surface, boxShadow: `inset 0 0 0 1px ${soft}` }} />
          <span className="col-span-2 block h-[14cqw] rounded-[2cqw]" style={{ background: p.accent }} />
          <span className="col-span-3 block h-[10cqw] rounded-[2cqw]" style={{ background: mix(p.accent, p.bg, 0.16) }} />
          <span className="col-span-3 block h-[10cqw] rounded-[2cqw]" style={{ background: p.alt }} />
        </div>
      );
      break;
    case "story":
      body = (
        <div className="flex flex-col px-[8cqw]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-[6cqw] border-t py-[2.6cqw]" style={{ borderColor: i === 0 ? ink : soft }}>
              <span className="block h-[1.6cqw] w-[4cqw] rounded-full" style={{ background: p.accent }} />
              <Bar t={t} w={i === 0 ? 70 : 55} c={soft} h={2} />
            </div>
          ))}
        </div>
      );
      break;
  }

  return (
    <div className={`@container relative overflow-hidden ${className}`} style={{ ...d.vars, background: p.bg, color: ink } as CSSProperties}>
      <div className="flex aspect-[4/5] flex-col justify-between pb-[7cqw]">
        {hero}
        <div className="pt-[6cqw]">{body}</div>
      </div>
    </div>
  );
}
