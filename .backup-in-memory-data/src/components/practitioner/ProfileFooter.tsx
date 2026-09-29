import { siteConfig } from "@/lib/site";

export function ProfileFooter() {
  return (
    <footer className="mt-20 border-t border-(--pt-border) px-[5.1px] py-10 sm:px-[12.8px] sm:py-16">
      <p className="text-sm text-(--pt-muted)">
        Powered by <span className="text-(--pt-text)">{siteConfig.name}</span>
      </p>
    </footer>
  );
}
