import Link from "next/link";
import { siteConfig } from "@/lib/site";

// The divider runs the full width of the page, edge to edge. The credit and the legal links sit below it in the same
// column as the sections above, so their edges line up with the headings.
export function ProfileFooter() {
  return (
    <footer className="mt-20 border-t border-[color-mix(in_srgb,var(--pt-text)_16%,transparent)]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[7.7px] py-6 sm:px-[12.8px] lg:px-[25.6px]">
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
