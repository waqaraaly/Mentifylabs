"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The product showreel in the hero. It plays muted and on a loop, which is what browsers allow to autoplay. A visitor
 * who prefers less motion sees the still and can start it themselves. The button lets anyone pause it, since it runs
 * for longer than a few seconds.
 */
export function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // play() rejects if the browser refuses autoplay (data saver, low power); the still stays up and the button works
    el.play().catch(() => {});
  }, []);

  function toggle() {
    const el = video.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }

  return (
    <div className="relative">
      <video
        ref={video}
        className="block aspect-video w-full bg-(--sage) object-cover"
        src="/video/homepage-hero.mp4"
        poster="/video/homepage-hero-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="A short demo: a practitioner's page, booking a time, setting weekly hours, sharing the link and getting verified"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause the demo" : "Play the demo"}
        className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-(--ink) shadow-sm ring-1 ring-black/10 backdrop-blur transition hover:bg-white"
      >
        {playing ? (
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
            <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
            <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
          </svg>
        ) : (
          <svg aria-hidden viewBox="0 0 24 24" className="ml-0.5 size-4" fill="currentColor">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
