import Link from "next/link";
import { FeaturesMenu } from "@/components/site/FeaturesMenu";
import { siteConfig } from "@/lib/site";

const LINKS = [
  { href: "/#your-link", label: "Sharing" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "Questions" },
];

/** The public site's top bar: sticks to the top, with a soft blur so content scrolls cleanly beneath it. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-(--hair)/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
        <Link href="/" aria-label={`${siteConfig.name} home`} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- a static local logo */}
          <img src="/brand/mentifylabs-logo.svg" alt={siteConfig.name} className="h-8 w-auto" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <FeaturesMenu />
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm font-medium text-(--quiet) transition hover:bg-black/5 hover:text-(--ink)">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-medium transition hover:bg-black/5">
            Log in
          </Link>
          <Link href="/signup" className="rounded-full bg-(--ink) px-5 py-2.5 text-sm font-medium text-white transition hover:bg-(--moss)">
            Join
          </Link>
        </div>
      </div>
    </header>
  );
}
