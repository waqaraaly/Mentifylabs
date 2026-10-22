"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-runs the server component on an interval so time-dependent UI (countdowns,
// "now" markers, session statuses) never goes stale while the tab stays open. Every refresh is a Worker request and
// several database reads, so the interval is long, and coming back to a tab that has been hidden refreshes at once.
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();

  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      // A little slack, so the timer firing a moment early is not skipped.
      if (Date.now() - last < seconds * 1000 - 1000) return;
      last = Date.now();
      router.refresh();
    };
    const id = setInterval(refresh, seconds * 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, seconds]);

  return null;
}
