import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * False on the server and during the first render, true afterwards. Used for anything only the browser can know (the
 * visitor's clock or time zone), so the page the server sent and the first browser render match, and the real value
 * is filled in right after.
 */
export function useInBrowser(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}
