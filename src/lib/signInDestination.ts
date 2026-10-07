/**
 * Where to send someone who has just signed in: the ?next= page if it is a same-site path inside their own area,
 * otherwise their home. Only same-site paths count, so the link can't send anyone to another website.
 */
export function signInDestination(next: string | string[] | null | undefined, home: string): string {
  const value = (Array.isArray(next) ? next[0] : next) ?? "";
  const safe = value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");
  return safe && value.startsWith(home) ? value : home;
}
