import { useSyncExternalStore } from "react";
import { deviceTimeZone } from "@/lib/time";

const subscribeNever = () => () => {};

/**
 * The time zone this device is set to, or undefined on the server and during the first render. A device's zone can't
 * change while a page is open, so there is nothing to subscribe to; this just keeps the server and first browser
 * render identical and fills the real value in right after.
 */
export function useDeviceTimeZone(): string | undefined {
  return useSyncExternalStore(subscribeNever, deviceTimeZone, () => undefined);
}
