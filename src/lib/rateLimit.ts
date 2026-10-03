import "server-only";
import { headers } from "next/headers";
import { first, run } from "@/lib/db";

/**
 * Small fixed-window limiter on the existing login_attempts table (key + timestamp), shared by sign-in,
 * sign-up and public booking. Keys are namespaced ("book:<ip>"), so they can't collide with emails.
 */
export async function clientIp(): Promise<string> {
  return (await headers()).get("cf-connecting-ip") ?? "local";
}

export async function isLimited(key: string, max: number, windowMinutes: number): Promise<boolean> {
  const row = await first<{ n: number }>(
    "SELECT count(*) AS n FROM login_attempts WHERE email = ? AND at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)",
    key,
    `-${windowMinutes} minutes`,
  );
  return (row?.n ?? 0) >= max;
}

export async function recordHit(key: string): Promise<void> {
  // Old rows are pruned as new ones arrive, so the table can't grow without bound.
  await run("DELETE FROM login_attempts WHERE at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')");
  await run("INSERT INTO login_attempts (email) VALUES (?)", key);
}
