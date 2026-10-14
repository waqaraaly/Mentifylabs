import Link from "next/link";
import { siteConfig } from "@/lib/site";

// The footer sits in the same column as the sections above it, so its rule and its text line up with their headings and
// edges instead of running to the edge of the page.
export function ProfileFooter() {
  return (
    <footer className="mt-8 px-[7.7px] pb-10 sm:px-[12.8px] sm:pb-12 lg:px-[25.6px]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[color-mix(in_srgb,var(--pt-text)_16%,transparent)] pt-7">
        <p className="text-sm text-(--pt-muted)">
          Powered by <span className="font-medium text-(--pt-text)">{siteConfig.name}</span>
        </p>
        <nav aria-label="Legal" className="flex gap-6 text-sm text-(--pt-muted)">
          <Link href="/privacy" className="transition hover:text-(--pt-text)">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-(--pt-text)">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
