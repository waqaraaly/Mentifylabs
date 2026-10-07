import type { Metadata } from "next";
import Link from "next/link";
import { Builder } from "@/components/site/Builder";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name}: your practice, on one page` },
  description:
    "Build the page for your practice in seconds: your name, your work and your real open times. Verified profiles, private requests, and nothing for clients to sign up for.",
};

export default function Home() {
  return (
    <main className="site">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" aria-label={siteConfig.name}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a static local logo */}
          <img src="/brand/mentifylabs-logo.svg" alt={siteConfig.name} className="h-8 w-auto" />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5">
            Log in
          </Link>
          <Link href="/signup" className="rounded-full bg-(--leaf-deep) px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-(--moss)">
            Join
          </Link>
        </nav>
      </header>

      <Builder />

      <footer className="border-t border-(--hair)">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-(--quiet) lg:px-10">
          <p>© {new Date().getFullYear()} {siteConfig.name}</p>
          <p className="flex gap-6">
            <Link href="/privacy" className="transition hover:text-(--ink)">Privacy</Link>
            <Link href="/terms" className="transition hover:text-(--ink)">Terms</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
