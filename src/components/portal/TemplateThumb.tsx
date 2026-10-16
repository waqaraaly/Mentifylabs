import type { CSSProperties, ReactNode } from "react";
import { mix } from "@/lib/color";
import { resolveDesign, type Palette, type PhotoShape, type LayoutId, type ProfileStyle } from "@/lib/templates";
import { SHAPE_STYLE } from "@/components/practitioner/templates/parts";

interface Ctx {
  p: Palette;
  ink: string;
  soft: string;
  faint: string;
  photoBg: string;
  shape: PhotoShape;
  scale: number;
  tone: string;
  toneOn: string;
}

function Bar({ t, w, h = 1.7, c, className = "" }: { t: Ctx; w: number | string; h?: number; c?: string; className?: string }) {
  return <span className={`block rounded-full ${className}`} style={{ width: typeof w === "number" ? `${w}%` : w, height: `${h}cqw`, background: c ?? t.faint }} />;
}

function Photo({ t, w, shape, extra }: { t: Ctx; w: string; shape?: PhotoShape; extra?: CSSProperties }) {
  const s = SHAPE_STYLE[shape ?? t.shape];
  return (
    <span className="relative block shrink-0 overflow-hidden" style={{ width: w, aspectRatio: s.aspect, borderRadius: s.radius, background: t.photoBg, ...extra }}>
      <span className="absolute top-[24%] left-1/2 block aspect-square w-[34%] -translate-x-1/2 rounded-full" style={{ background: mix(t.ink, t.photoBg, 0.35) }} />
      <span className="absolute top-[56%] left-1/2 block aspect-[5/3] w-[70%] -translate-x-1/2 rounded-t-full" style={{ background: mix(t.ink, t.photoBg, 0.35) }} />
    </span>
  );
}

function Name({ t, size, color, align = "left" }: { t: Ctx; size: number; color?: string; align?: "left" | "center" }) {
  return (
    <span className="pt-display block leading-[1.05]" style={{ fontSize: `${size * t.scale}cqw`, color: color ?? t.ink, textAlign: align }}>
      Dr. Amina Rahman
    </span>
  );
}

function Pill({ t, w = 20, c, outline = false }: { t: Ctx; w?: number; c?: string; outline?: boolean }) {
  const color = c ?? t.p.accent;
  return <span className="block rounded-[1cqw]" style={{ width: `${w}cqw`, height: "4.6cqw", background: outline ? "transparent" : color, boxShadow: outline ? `inset 0 0 0 0.45cqw ${color}` : undefined }} />;
}

function Badges({ t, n = 3 }: { t: Ctx; n?: number }) {
  return (
    <div className="flex gap-[1.4cqw]">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="block h-[3.4cqw] rounded-full" style={{ width: `${[13, 17, 11][i]}cqw`, background: mix(t.p.accent, t.p.bg, 0.16), boxShadow: `inset 0 0 0 1px ${t.soft}` }} />
      ))}
    </div>
  );
}

function Box({ t, h, w, tone, className = "" }: { t: Ctx; h: number; w?: string; tone?: "accent" | "tint" | "plain"; className?: string }) {
  const bg = tone === "accent" ? t.p.accent : tone === "tint" ? mix(t.p.accent, t.p.bg, 0.12) : t.p.surface;
  return <span className={`block ${className}`} style={{ height: `${h}cqw`, width: w, borderRadius: "1.8cqw", background: bg, boxShadow: tone === "accent" ? undefined : `inset 0 0 0 1px ${t.soft}` }} />;
}

function Times({ t }: { t: Ctx }) {
  return (
    <div className="flex gap-[1.4cqw]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="block h-[3.6cqw] flex-1 rounded-[0.9cqw]" style={{ boxShadow: `inset 0 0 0 0.4cqw ${t.p.accent}` }} />
      ))}
    </div>
  );
}

/**
 * A small drawing of a template: its page architecture, palette, photo shape and typeface. It is drawn from the same
 * recipe the real page uses (resolveDesign), so it follows the practitioner's accent, typeface and shape choices as they
 * make them. Sizes are in container units, so it scales to any card.
 */
export function TemplateThumb({ id, style, className = "" }: { id: LayoutId; style?: ProfileStyle; className?: string }) {
  const d = resolveDesign(id, style);
  const { palette: p, spec, shape } = d;
  const ink = p.ink;
  const t: Ctx = {
    p,
    ink,
    soft: mix(ink, p.bg, 0.16),
    faint: mix(ink, p.bg, 0.3),
    photoBg: mix(p.accent, p.bg, 0.3),
    shape,
    scale: Number(d.vars["--pt-ds"]),
    tone: d.vars["--pt-tone"],
    toneOn: d.vars["--pt-tone-foreground"],
  };

  const identity = (
    <div className="flex items-start gap-[4cqw]">
      <Photo t={t} w="20cqw" />
      <div className="flex flex-1 flex-col gap-[1.8cqw] pt-[0.5cqw]">
        <Name t={t} size={6.2} />
        <Bar t={t} w={60} h={1.5} />
        <Badges t={t} />
      </div>
    </div>
  );

  let art: ReactNode;
  switch (spec.layout) {
    case "rail": {
      const header = spec.header ?? "card";
      art = (
        <div className="flex flex-col gap-[4cqw]">
          {header === "band" ? (
            <div className="px-[7cqw] py-[5cqw]" style={{ background: t.tone }}>{identity}</div>
          ) : header === "card" ? (
            <div className="mx-[6cqw] mt-[5cqw] rounded-[2.4cqw] p-[4cqw]" style={{ background: p.surface, boxShadow: `inset 0 0 0 1px ${t.soft}` }}>{identity}</div>
          ) : (
            <div className="px-[7cqw] pt-[6cqw]">{identity}</div>
          )}
          <div className="grid grid-cols-[1fr_28cqw] gap-[3cqw] px-[6cqw]">
            <div className="flex flex-col gap-[2.4cqw]">
              <Box t={t} h={13} />
              <Box t={t} h={11} />
            </div>
            <div className="flex flex-col gap-[2cqw] rounded-[1.8cqw] p-[2.4cqw]" style={{ background: p.surface, boxShadow: `inset 0 0 0 1px ${t.soft}` }}>
              <Bar t={t} w={70} c={ink} h={1.8} />
              <Times t={t} />
              <Times t={t} />
              <Pill t={t} w={23} />
            </div>
          </div>
        </div>
      );
      break;
    }
    case "tabs":
      art = (
        <div className="flex flex-col gap-[3.5cqw]">
          <div className="grid grid-cols-[1fr_28cqw] gap-[3cqw] px-[6cqw] pt-[6cqw]">
            {identity}
            <div className="flex flex-col gap-[2cqw] rounded-[1.8cqw] p-[2.4cqw]" style={{ background: p.surface, boxShadow: `inset 0 0 0 1px ${t.soft}` }}>
              <Bar t={t} w={70} c={ink} h={1.8} />
              <Times t={t} />
              <Pill t={t} w={23} />
            </div>
          </div>
          <div className="flex gap-[5cqw] border-y px-[6cqw] py-[2.4cqw]" style={{ borderColor: t.soft }}>
            {[12, 14, 11, 9].map((w, i) => (
              <span key={i} className="block h-[1.8cqw] rounded-full" style={{ width: `${w}cqw`, background: i === 0 ? p.accent : t.faint }} />
            ))}
          </div>
          <div className="flex flex-col gap-[2cqw] px-[6cqw]">
            <Bar t={t} w={30} h={3} c={ink} />
            <Bar t={t} w={92} />
            <Bar t={t} w={78} />
          </div>
        </div>
      );
      break;
    case "clinic":
      art = (
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b px-[6cqw] py-[3cqw]" style={{ borderColor: t.soft, background: p.surface }}>
            <Bar t={t} w="22cqw" c={ink} h={2} />
            <Pill t={t} w={14} />
          </div>
          <div className="grid grid-cols-[1.15fr_0.85fr] items-center gap-[4cqw] px-[6cqw] py-[6cqw]" style={{ background: p.alt }}>
            <div className="flex flex-col gap-[2cqw]">
              <Bar t={t} w={30} c={p.accent} h={1.2} />
              <Name t={t} size={8} />
              <Bar t={t} w={90} />
              <Badges t={t} n={2} />
              <Pill t={t} w={20} />
            </div>
            <Photo t={t} w="100%" />
          </div>
          <div className="flex flex-col gap-[2cqw] px-[6cqw] py-[4cqw]">
            <Bar t={t} w={34} h={3} c={ink} />
            <div className="grid grid-cols-3 gap-[2cqw]">
              <Box t={t} h={10} />
              <Box t={t} h={10} />
              <Box t={t} h={10} />
            </div>
          </div>
          <div className="mx-0 mt-[1cqw] px-[6cqw] py-[4cqw]" style={{ background: p.accent }}>
            <Bar t={t} w={40} c={mix(t.toneOn === ink ? p.bg : p.bg, p.accent, 0.9)} h={2} />
          </div>
        </div>
      );
      break;
    case "directory":
      art = (
        <div className="flex flex-col gap-[2.6cqw] px-[9cqw] pt-[5cqw]">
          <div className="rounded-[2cqw] p-[3.6cqw]" style={{ background: p.surface, boxShadow: `inset 0 0 0 1px ${t.soft}` }}>
            <div className="flex items-center gap-[3.5cqw]">
              <Photo t={t} w="17cqw" />
              <div className="flex flex-1 flex-col gap-[1.6cqw]">
                <Name t={t} size={5.6} />
                <Bar t={t} w={58} h={1.4} />
              </div>
            </div>
            <div className="mt-[3cqw] grid grid-cols-3 divide-x border-t pt-[2.4cqw]" style={{ borderColor: t.soft }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="mx-auto block h-[2.4cqw] w-[10cqw] rounded-full" style={{ background: t.faint }} />
              ))}
            </div>
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[2cqw] p-[3cqw]" style={{ background: p.surface, boxShadow: `inset 0 0 0 1px ${t.soft}` }}>
              <div className="mb-[2cqw] flex items-center justify-between">
                <Bar t={t} w="28cqw" c={ink} h={2} />
                <Pill t={t} w={16} />
              </div>
              <Times t={t} />
            </div>
          ))}
          <Box t={t} h={9} />
        </div>
      );
      break;
    case "narrative":
      art = (
        <div className="flex flex-col gap-[5cqw] px-[8cqw] pt-[8cqw]">
          <div className="grid grid-cols-[1fr_22cqw] items-start gap-[5cqw]">
            <div className="flex flex-col gap-[2.2cqw]">
              <Bar t={t} w={36} c={p.accent} h={1.2} />
              <Name t={t} size={9.5} />
              <div className="border-l-[0.8cqw] pl-[2.6cqw]" style={{ borderColor: p.accent }}>
                <Bar t={t} w={95} h={2.2} c={t.faint} />
                <div className="mt-[1.4cqw]"><Bar t={t} w={70} h={2.2} c={t.faint} /></div>
              </div>
              <Pill t={t} w={20} />
            </div>
            <Photo t={t} w="100%" />
          </div>
          <div className="grid grid-cols-[1fr_26cqw] gap-[4cqw] border-t pt-[4cqw]" style={{ borderColor: t.soft }}>
            <div className="flex flex-col gap-[2cqw]">
              <Bar t={t} w={36} h={3} c={ink} />
              <Bar t={t} w={95} />
              <Bar t={t} w={82} />
            </div>
            <Box t={t} h={16} />
          </div>
        </div>
      );
      break;
    case "card":
      art = (
        <div className="px-[14cqw] pt-[6cqw]">
          <div className="overflow-hidden rounded-[3.4cqw]" style={{ background: p.surface, boxShadow: "0 3cqw 6cqw -3cqw rgba(0,0,0,.35)" }}>
            <div className="h-[11cqw]" style={{ background: p.alt }} />
            <div className="flex flex-col items-center gap-[2cqw] px-[5cqw] pb-[4cqw]">
              <Photo t={t} w="17cqw" extra={{ marginTop: "-8.5cqw", boxShadow: `0 0 0 1.2cqw ${p.surface}` }} />
              <Name t={t} size={5.8} align="center" />
              <Badges t={t} />
              <span className="block h-[6cqw] w-full rounded-[1.4cqw]" style={{ background: p.accent }} />
              <span className="block h-[5cqw] w-full rounded-[1.4cqw]" style={{ boxShadow: `inset 0 0 0 0.45cqw ${p.accent}` }} />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between border-t px-[5cqw] py-[2.6cqw]" style={{ borderColor: t.soft }}>
                <Bar t={t} w="22cqw" c={ink} h={1.8} />
                <span className="block size-[2cqw] rounded-full" style={{ background: t.faint }} />
              </div>
            ))}
          </div>
        </div>
      );
      break;
    case "panel":
      art = (
        <div className="grid h-[88cqw] grid-cols-[34cqw_1fr]">
          <div className="flex flex-col items-start gap-[2.4cqw] p-[4.5cqw]" style={{ background: t.tone }}>
            <Photo t={t} w="19cqw" />
            <Name t={t} size={5.4} color={t.toneOn} />
            <Bar t={t} w={80} h={1.4} c={mix(t.toneOn, t.tone, 0.6)} />
            <div className="mt-[1cqw] w-full rounded-[1.6cqw] p-[2.4cqw]" style={{ background: p.surface }}>
              <Times t={t} />
              <div className="mt-[1.6cqw]"><Pill t={t} w={20} /></div>
            </div>
          </div>
          <div className="flex flex-col gap-[2.2cqw] px-[5cqw] pt-[6cqw]">
            <Bar t={t} w={80} h={2.6} c={t.faint} />
            <Bar t={t} w={36} h={3} c={ink} />
            <Bar t={t} w={95} />
            <Bar t={t} w={82} />
            <div className="mt-[2cqw] flex gap-[1.6cqw]">
              {[16, 20, 14].map((w, i) => (
                <span key={i} className="block h-[4.6cqw] rounded-full" style={{ width: `${w}cqw`, background: mix(p.accent, p.bg, 0.16), boxShadow: `inset 0 0 0 1px ${t.soft}` }} />
              ))}
            </div>
            <Bar t={t} w={36} h={3} c={ink} />
            <Bar t={t} w={90} />
          </div>
        </div>
      );
      break;
  }

  const pageBg = d.vars["--pt-page"];
  return (
    <div className={`@container relative overflow-hidden ${className}`} style={{ ...d.vars, background: pageBg, color: ink } as CSSProperties}>
      <div className="aspect-[4/5] overflow-hidden">{art}</div>
    </div>
  );
}
