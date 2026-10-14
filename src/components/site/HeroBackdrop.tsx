/**
 * The hero's background, "layered swoop": two sweeping sage curves rising from the right edge, a thin honey line riding
 * the upper one, a soft honey sun and a fine paper grain. The curves stretch with the hero, so the sun is a separate
 * element to stay round. Decorative, behind everything in the hero.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg viewBox="0 0 1200 700" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path d="M520 700 C 640 560, 700 380, 820 250 C 920 140, 1040 90, 1200 70 L1200 700 Z" fill="#e8efdc" />
        <path d="M660 700 C 760 600, 800 470, 900 360 C 990 262, 1090 215, 1200 205 L1200 700 Z" fill="#dce7cb" />
        <path
          d="M660 700 C 760 600, 800 470, 900 360 C 990 262, 1090 215, 1200 205"
          fill="none"
          stroke="#f0c05a"
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute top-[12%] right-[5%] size-[clamp(56px,7vw,100px)] rounded-full bg-[#f9e6b0]/70" />
      <div className="hero-grain absolute inset-0" />
    </div>
  );
}
