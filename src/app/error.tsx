"use client";

import { useEffect } from "react";
import { siteConfig } from "@/lib/site";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center bg-background">
      <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10 lg:py-32">
        <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {siteConfig.name}
        </p>
        <h1 className="mt-6 max-w-2xl font-serif text-4xl leading-[1.15] sm:text-5xl">
          Something went wrong.
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted">
          Our side, not yours. Try again, and if it keeps happening, let us know.
        </p>

        <button
          onClick={reset}
          className="mt-10 inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
