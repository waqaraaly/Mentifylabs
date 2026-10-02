"use client";

import { useEffect } from "react";

/**
 * Reports one view of this profile per browser tab session. Renders nothing. Sends only the page's
 * slug, the referrer and an optional ?utm_source — the server adds country and device type itself.
 */
export function ProfileViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `pv:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: the server's own repeat-visit window still prevents double counting.
    }
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    fetch("/api/pv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, referrer: document.referrer, utm }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
