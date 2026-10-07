"use client";

import { useEffect, useRef, useState } from "react";
import { ProfileBody } from "@/components/practitioner/ProfileBody";
import { siteConfig } from "@/lib/site";
import { DEFAULT_COLOR_THEME } from "@/lib/themes";
import type { Practitioner } from "@/types/practitioner";

/**
 * A whole public profile, laid out at a desktop width and scaled down to fit a narrow panel, with its own scrolling.
 * It draws the same body the live page does (see ProfileBody), in the profile's colour theme, so what it shows is what a
 * visitor would see. It has no booking window and no tracking: it is only for looking at.
 */
export function ScaledProfile({ practitioner, width = 880 }: { practitioner: Practitioner; width?: number }) {
  const holder = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(0);

  // The scale follows the panel's width, and the scroll length follows the page's height as it grows with what is typed.
  useEffect(() => {
    const frame = holder.current;
    const page = content.current;
    if (!frame || !page) return;
    const resize = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    const grow = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    resize.observe(frame);
    grow.observe(page);
    return () => {
      resize.disconnect();
      grow.disconnect();
    };
  }, [width]);

  return (
    <div ref={holder} data-pt-theme={practitioner.colorTheme ?? DEFAULT_COLOR_THEME} className="themed-scrollbar h-full overflow-x-hidden overflow-y-auto bg-(--pt-outer) transition-colors duration-500">
      <div style={{ height: height * scale }}>
        <div ref={content} style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }} className="p-4">
          <div className="overflow-hidden rounded-[36px] bg-(--pt-bg) text-(--pt-text) transition-colors duration-500">
            <div className="flex items-center justify-between border-b border-(--pt-border) px-8 py-4">
              <p className="text-2xl tracking-[0.02em]">{siteConfig.name}</p>
              <span className="rounded-full bg-(--pt-accent) px-6 py-2.5 text-[15px] font-semibold text-(--pt-accent-foreground)">Book a Session</span>
            </div>
            <ProfileBody practitioner={practitioner} />
          </div>
        </div>
      </div>
    </div>
  );
}
