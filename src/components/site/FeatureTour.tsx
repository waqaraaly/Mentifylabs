"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { FeatureVisual } from "@/components/site/FeatureVisual";
import { FEATURE_PAGES } from "@/lib/featurePages";

const DURATION = 2000;

const LESS_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(LESS_MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * In action: the features listed on the left, one highlighted at a time, and that feature's picture playing on the
 * right. It moves down the list by itself while the section is on screen; choosing a feature jumps to it. Visitors who
 * prefer less motion move through it themselves.
 */
export function FeatureTour() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const calm = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(LESS_MOTION).matches,
    () => false,
  );
  const section = useRef<HTMLElement>(null);

  // Only play while the section is on screen, so it starts at the first feature when someone scrolls to it.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const watch = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  const running = visible && !calm;
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % FEATURE_PAGES.length),
      DURATION,
    );
    return () => clearTimeout(timer);
  }, [running, index]);

  // The honey bar beside the list glides to the current name. It is placed straight on the element (no re-render), and
  // placed again when the list changes size, so it always lines up with the name it marks.
  const list = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const ol = list.current;
    const mark = bar.current;
    if (!ol || !mark) return;
    const place = () => {
      const item = ol.children[index + 1] as HTMLElement | undefined; // the bar itself is the first child
      if (!item) return;
      mark.style.transform = `translateY(${item.offsetTop}px)`;
      mark.style.height = `${item.offsetHeight}px`;
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(ol);
    return () => watch.disconnect();
  }, [index]);

  const feature = FEATURE_PAGES[index];

  return (
    // Split screen: powder blue on the left with the heading and the feature names, white on the right with the
    // picture. On wide screens each colour runs to its edge of the window; on phones the halves stack.
    <section
      ref={section}
      id="in-action"
      className="scroll-mt-20 bg-white lg:bg-[linear-gradient(to_right,#e7f0fa_50%,#ffffff_50%)]"
    >
      <div className="mx-auto grid w-full max-w-7xl lg:grid-cols-2">
        <div className="bg-[#e7f0fa] px-6 py-16 lg:bg-transparent lg:py-28 lg:pr-16 lg:pl-10">
          <p className="text-sm font-medium text-[#36618d]">In action</p>
          <h2 className="mt-3 max-w-[14ch] text-[clamp(2.2rem,4.2vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.045em] text-balance text-(--ink)">
            See every part of it at work.
          </h2>

          <div className="mt-10">
            {/* The features: just their names, large and bold. A honey bar glides down to the one playing, which slides in
                  a little and darkens while the one before eases back. */}
            <ol ref={list} className="relative grid gap-1 pl-6">
              <span
                ref={bar}
                aria-hidden
                className="absolute top-0 left-0 w-[3px] rounded-full bg-(--glow) transition-[transform,height] duration-[650ms] ease-[cubic-bezier(.34,1.3,.5,1)] motion-reduce:transition-none"
              />
              {FEATURE_PAGES.map((f, i) => {
                const on = i === index;
                return (
                  <li key={f.slug}>
                    <button
                      type="button"
                      aria-current={on ? "true" : undefined}
                      onClick={() => setIndex(i)}
                      className={`w-full py-1.5 text-left text-[clamp(1.6rem,2.6vw,2.3rem)] leading-tight font-bold tracking-[-0.035em] transition-[color,translate] duration-[650ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
                        on
                          ? "translate-x-2 text-(--ink)"
                          : "translate-x-0 text-(--ink)/20 hover:text-(--ink)/45"
                      }`}
                    >
                      {f.name}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* the picture, straight on the white half */}
        <div className="flex flex-col justify-center px-6 py-16 lg:py-28 lg:pr-10 lg:pl-16">
          <div className="grid h-[400px] place-items-center sm:h-[480px]">
            <div
              key={feature.slug}
              className="flex w-full justify-center motion-safe:animate-[flow-in_.7s_cubic-bezier(.2,.8,.2,1)_both]"
            >
              <FeatureVisual slug={feature.slug} inHero />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-(--hair) pt-4">
            <p
              className="truncate text-[15px] font-semibold text-(--ink)"
              aria-live="polite"
            >
              {feature.name}
            </p>
            <Link
              href={`/features/${feature.slug}`}
              className="shrink-0 text-[14px] font-medium text-(--leaf-deep) underline decoration-(--sage-edge) underline-offset-4 transition hover:decoration-(--leaf)"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
