"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Globe, X } from "lucide-react";
import { useDeviceTimeZone } from "@/lib/useDeviceTimeZone";

const EVENT = "ml-timezone-notice";
const storageKey = (device: string, saved: string) => `ml_tz_notice:${device}|${saved}`;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function wasDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * A quiet heads-up when this device is set to a different zone from the practitioner's profile, which happens after
 * travelling or when the wrong zone was picked. Their slots and sessions always follow the profile, so nothing breaks;
 * it just says so and points at Settings. Dismissing it is remembered for that exact pair of zones.
 */
export function TimeZoneNotice({ saved }: { saved: string }) {
  const device = useDeviceTimeZone();
  const key = device ? storageKey(device, saved) : "";
  // Hidden on the server and during the first render, so what the server sent and what the browser draws match.
  const dismissed = useSyncExternalStore(subscribe, () => (key ? wasDismissed(key) : true), () => true);

  if (!device || device === saved || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* the notice just comes back next time */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  const name = (zone: string) => zone.replace(/_/g, " ");

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl bg-accent/[0.1] px-4 py-3 text-sm text-accent-strong ring-1 ring-accent/20">
      <Globe className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 leading-relaxed">
        This device is set to {name(device)} time, but your profile runs on {name(saved)} time. Your slots and sessions follow your profile.{" "}
        <Link href="/dashboard/settings" className="font-semibold underline underline-offset-2">
          Review in Settings
        </Link>
      </p>
      <button type="button" onClick={dismiss} aria-label="Dismiss this notice" className="shrink-0 rounded p-1 hover:bg-black/[0.06]">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
