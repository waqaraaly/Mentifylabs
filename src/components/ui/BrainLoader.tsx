"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

declare global {
  interface Window {
    BrainLoader?: { mount: (el: HTMLElement) => { destroy: () => void } };
  }
}

// The animation itself is a self-contained canvas script in /public — loaded
// once, on first use, and shared by every loader on the page.
let scriptReady: Promise<void> | null = null;
function loadBrainScript(): Promise<void> {
  if (window.BrainLoader) return Promise.resolve();
  scriptReady ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/brain-loader.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptReady = null;
      reject(new Error("brain-loader.js failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptReady;
}

/** The animated brain, centered by its parent. Colors are the palette the
 * loader was designed with: softened moss tubes, moss fluid, teal signal. */
export function BrainLoader({ size = 110, onReady }: { size?: number; onReady?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let handle: { destroy: () => void } | undefined;
    loadBrainScript()
      .then(() => {
        if (!cancelled && ref.current && window.BrainLoader) {
          handle = window.BrainLoader.mount(ref.current);
          onReady?.();
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      handle?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; onReady is only called back
  }, []);

  return (
    <div
      ref={ref}
      className="brain-loader"
      role="status"
      aria-label="Loading"
      style={
        {
          width: `min(${size}px, 68vw)`,
          aspectRatio: "1 / 1.0261",
          "--brain-line": "#d2d8c3",
          "--brain-fluid": "#6e8356",
          "--brain-signal": "#1d6273",
        } as React.CSSProperties
      }
    />
  );
}

/**
 * The brain for a moment the user is genuinely waiting on. Two timing rules
 * keep it from feeling like decoration:
 *  - it only appears if the wait outlasts `delay` (quick responses show nothing);
 *  - once it appears it stays for at least `minVisible`, so it never flashes.
 */
export function LoadingOverlay({
  active,
  message,
  delay = 300,
  minVisible = 800,
}: {
  active: boolean;
  message?: string;
  delay?: number;
  minVisible?: number;
}) {
  const [visible, setVisible] = useState(false);
  // Fetch the animation script up front so it's ready the moment a wait begins.
  useEffect(() => {
    loadBrainScript().catch(() => {});
  }, []);
  const shownAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    if (active) {
      timer.current = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, delay);
    } else {
      const remaining = Math.max(0, minVisible - (Date.now() - shownAt.current));
      timer.current = setTimeout(() => setVisible(false), remaining);
    }
    return () => clearTimeout(timer.current);
  }, [active, delay, minVisible]);

  if (!visible) return null;
  // Rendered straight into <body>, so no card, sidebar or transformed ancestor
  // can ever shift what "the center" is measured from.
  return createPortal(<LoaderScreen message={message} />, document.body);
}

/** The brain dead-center in the window. The message hangs below the brain rather than sharing the
 * flex flow, so adding text never pushes the brain off center. */
export function LoaderScreen({ message }: { message?: string }) {
  // The message fades in only once the brain is drawn, so the two always
  // appear together instead of the text showing alone first.
  const [ready, setReady] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/90 backdrop-blur-sm"
    >
      <div className="relative">
        <BrainLoader onReady={() => setReady(true)} />
        {message && (
          <p
            className={`absolute top-full left-1/2 mt-4 -translate-x-1/2 text-center text-sm font-medium whitespace-nowrap text-muted transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
