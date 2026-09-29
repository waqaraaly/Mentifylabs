import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function ProfileFooter() {
  return (
    <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-(--pt-border) px-[5.1px] py-10 sm:px-[12.8px] sm:py-16">
      <p className="text-sm text-(--pt-muted)">
        Powered by <span className="text-(--pt-text)">{siteConfig.name}</span>
      </p>
      <p className="flex gap-4 text-sm text-(--pt-muted)">
        <Link href="/privacy" className="hover:text-(--pt-text)">Privacy</Link>
        <Link href="/terms" className="hover:text-(--pt-text)">Terms</Link>
      </p>
    </footer>
  );
}
