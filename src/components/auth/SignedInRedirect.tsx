"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingOverlay, SIGNED_IN_LOADER_MS } from "@/components/ui/BrainLoader";

/**
 * What the sign-in pages show once someone is signed in: the brain, then their portal.
 *
 * It has to live in the page rather than the form. Signing in sets a cookie in a server action, and Next then re-renders
 * the current page on the server. If that page redirected signed-in visitors right there, the browser would jump to the
 * portal before the form could show anything. The page renders this instead, so the loader plays at that moment.
 */
export function SignedInRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(to);
    const timer = setTimeout(() => router.replace(to), SIGNED_IN_LOADER_MS);
    return () => clearTimeout(timer);
  }, [to, router]);

  return (
    <main className="min-h-screen bg-background">
      <LoadingOverlay active delay={0} message="Signing you in…" />
    </main>
  );
}
