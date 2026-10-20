import Link from "next/link";
import { Eye } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Slot } from "@/types/slot";
import { resolveDesign, type LayoutId, type ProfileStyle } from "@/lib/templates";
import { siteConfig } from "@/lib/site";
import { BookingModal } from "@/components/practitioner/BookingModal";
import { PreviewBookingNotice } from "@/components/practitioner/templates/PreviewBookingNotice";
import { StickyBookingBar } from "@/components/practitioner/StickyBookingBar";
import { StructuredData } from "@/components/practitioner/StructuredData";
import { ProfileViewTracker } from "@/components/practitioner/ProfileViewTracker";
import { TEMPLATE_FONT_CLASSES } from "@/components/practitioner/templates/fonts";
import { buildModel } from "@/components/practitioner/templates/model";
import { LayoutRail } from "@/components/practitioner/templates/layoutsA";
import { LayoutLinkPage } from "@/components/practitioner/templates/layoutsC";

const LAYOUTS = { rail: LayoutRail, linkpage: LayoutLinkPage };

/**
 * A public profile drawn with one of the templates. The live page and the private preview both use it, with the same
 * `preview` switch as the classic layout: in the preview nothing can be booked.
 */
export function TemplateProfile({
  practitioner,
  slots,
  template,
  style,
  preview = false,
  embedded = false,
}: {
  practitioner: Practitioner;
  slots: Slot[];
  template: LayoutId;
  style?: ProfileStyle;
  preview?: boolean;
  /** Drawn inside a small frame in the portal: no banner. */
  embedded?: boolean;
}) {
  const design = resolveDesign(template, style);
  const m = buildModel(practitioner, preview, slots);
  const Layout = LAYOUTS[design.spec.layout];

  return (
    <main
      data-pt-template={design.spec.id}
      style={design.vars}
      className={`${TEMPLATE_FONT_CLASSES} relative flex min-h-screen flex-col overflow-x-clip`}
    >
      {preview && !embedded && (
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 bg-neutral-900 px-5 py-3 text-sm font-medium text-white">
          <Eye className="size-4 shrink-0" aria-hidden />
          Private preview. Only you can see this page, and nobody can book from it. Clients can find and book you once you publish.
          <Link href="/dashboard/profile" className="ml-auto shrink-0 underline underline-offset-2">
            Back to portal
          </Link>
        </div>
      )}

      <StructuredData practitioner={practitioner} />
      {!preview && <ProfileViewTracker slug={practitioner.slug} />}
      {!preview && practitioner.acceptingBookings && <BookingModal practitioner={practitioner} slots={slots} />}
      {preview && <PreviewBookingNotice />}

      <div className="relative z-[2] flex-1">
        <Layout m={m} d={design} />
      </div>

      <footer className="relative z-[2] mx-auto w-full max-w-6xl px-5 pb-28 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-(--pt-border) pt-7 text-sm text-(--pt-muted)">
          <p>
            Powered by <span className="font-medium text-(--pt-text)">{siteConfig.name}</span>
          </p>
          <nav aria-label="Legal" className="flex gap-6">
            <Link href="/privacy" className="transition hover:text-(--pt-text)">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-(--pt-text)">
              Terms
            </Link>
          </nav>
        </div>
      </footer>

      {/* Booking is already in view beside the page on a large screen, so the bar is only for the phone layout. */}
      <StickyBookingBar slots={slots} practitionerZone={practitioner.timezone} accepting={practitioner.acceptingBookings} phoneOnly />
    </main>
  );
}
