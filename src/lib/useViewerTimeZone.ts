import { useDeviceTimeZone } from "@/lib/useDeviceTimeZone";

/**
 * The time zone a visitor sees a practitioner's times in: the one their device is set to, with nothing for them to
 * choose. On the server, and until the page is in their browser, it is `fallback` (the practitioner's own zone), so
 * the page the server sends reads in the practitioner's time with its zone tag, then switches to the visitor's.
 */
export function useViewerTimeZone(fallback: string): { zone: string; deviceZone: string | undefined } {
  const device = useDeviceTimeZone();
  return { zone: device ?? fallback, deviceZone: device };
}
