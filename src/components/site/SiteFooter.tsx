import Link from "next/link";
import { siteConfig } from "@/lib/site";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#share", label: "Sharing" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "Questions" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Join" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/** A soft sage panel: the logo, every link in one row, and the small print. */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-6 pb-6 lg:px-10 lg:pb-10">
      <div className="grid justify-items-center gap-5 rounded-[26px] bg-(--sage) px-6 py-9 text-center ring-1 ring-(--sage-edge)">
        <Link href="/" aria-label={`${siteConfig.name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a static local logo */}
          <img src="/brand/mentifylabs-logo.svg" alt={siteConfig.name} className="h-8 w-auto" />
        </Link>
        <p className="text-[15px] text-(--quiet)">Your practice, on one page.</p>

        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px]">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-(--leaf-deep)">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[13.5px] text-(--quiet)">
          <p>© {new Date().getFullYear()} {siteConfig.name}</p>
          <p>
            Privacy questions:{" "}
            <a href="mailto:privacy@mentifylabs.com" className="underline decoration-(--sage-edge) underline-offset-4 transition hover:text-(--ink)">
              privacy@mentifylabs.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
