"use client";

import { useEffect, useRef, useState } from "react";

const PAGE_WIDTH = 1280;

/**
 * The real profile page, shown small: the private preview loaded in a frame at desktop width and scaled down to fit.
 * Only the top of the page shows, so every card is the same size. The frame waits briefly after a change so picking
 * through colours does not reload it on every click.
 */
export function LivePagePreview({ src, className = "" }: { src: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  const [url, setUrl] = useState(src);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / PAGE_WIDTH);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setUrl(src), 400);
    return () => clearTimeout(timer);
  }, [src]);

  return (
    <div ref={box} aria-hidden className={`relative aspect-[4/5] w-full overflow-hidden bg-white ${className}`}>
      <iframe
        src={url}
        title=""
        tabIndex={-1}
        loading="lazy"
        className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
        style={{ width: PAGE_WIDTH, height: PAGE_WIDTH * 1.25, transform: `scale(${scale})` }}
      />
    </div>
  );
}
