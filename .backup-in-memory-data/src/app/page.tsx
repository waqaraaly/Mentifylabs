import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10 lg:py-32">
        <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {siteConfig.name}
        </p>
        <h1 className="mt-6 max-w-2xl font-serif text-4xl leading-[1.15] sm:text-5xl">
          Find and book trusted therapists.
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted">
          Every practitioner gets a clean, professional profile with a
          shareable booking link.
        </p>

        <Link
          href="/dr-ali"
          className="mt-10 inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          View a sample profile
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
