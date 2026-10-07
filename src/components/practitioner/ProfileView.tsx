import Link from "next/link";
import { Eye } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Slot } from "@/types/slot";
import { siteConfig } from "@/lib/site";
import { DEFAULT_COLOR_THEME } from "@/lib/themes";
import { ProfileBody } from "@/components/practitioner/ProfileBody";
import { ProfileFooter } from "@/components/practitioner/ProfileFooter";
import { StickyBookingBar } from "@/components/practitioner/StickyBookingBar";
import { BookSessionButton } from "@/components/practitioner/BookSessionButton";
import { BookingModal } from "@/components/practitioner/BookingModal";
import { StructuredData } from "@/components/practitioner/StructuredData";
import { ProfileViewTracker } from "@/components/practitioner/ProfileViewTracker";

/**
 * The public profile's full layout, shared between the live page (/[username])
 * and the practitioner's own preview (/preview/[slug]). `preview` swaps the
 * booking CTAs for a disabled placeholder and adds a top banner — nobody can
 * book a session from a profile that isn't actually published yet.
 */
export function ProfileView({
  practitioner,
  slots,
  preview = false,
}: {
  practitioner: Practitioner;
  slots: Slot[];
  preview?: boolean;
}) {
  return (
    <main
      data-pt-theme={practitioner.colorTheme ?? DEFAULT_COLOR_THEME}
      // The floating booking bar sits over the bottom of the page, so there is room under the footer for it.
      className={`min-h-screen bg-(--pt-outer) p-[7.5px] sm:p-[16.5px] ${preview ? "" : "pb-28 sm:pb-28"}`}
    >
      {preview && (
        <div className="mx-auto mb-[7.5px] flex max-w-[1360px] items-center gap-2.5 rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background">
          <Eye className="size-4 shrink-0" aria-hidden />
          Private preview. Only you can see this page, and nobody can book from it. Clients can find and book you once you publish.
          <Link href="/dashboard/profile" className="ml-auto shrink-0 underline underline-offset-2">
            Back to portal
          </Link>
        </div>
      )}

      <div className="overflow-hidden rounded-[36px] bg-(--pt-bg) text-(--pt-text)">
        <StructuredData practitioner={practitioner} />

        {!preview && <ProfileViewTracker slug={practitioner.slug} />}

        {!preview && practitioner.acceptingBookings && <BookingModal practitioner={practitioner} slots={slots} />}

        <div className="sticky top-0 z-50 border-b border-(--pt-border) bg-(--pt-bg)">
          <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-[7.7px] py-[14px] sm:px-[12.8px] lg:px-[25.6px]">
            <p className="text-xl tracking-[0.02em] text-(--pt-text) sm:text-2xl">{siteConfig.name}</p>
            {preview ? (
              <span
                title="Publish your profile to let clients book you"
                className="shrink-0 rounded-full bg-(--pt-icon-fill) px-4 py-2.5 text-[15px] font-semibold whitespace-nowrap text-(--pt-muted) sm:px-6"
              >
                Book a Session
              </span>
            ) : practitioner.acceptingBookings ? (
              <BookSessionButton />
            ) : (
              <span className="shrink-0 rounded-full bg-(--pt-icon-fill) px-4 py-2.5 text-[14px] font-semibold whitespace-nowrap text-(--pt-muted) sm:px-6 sm:text-[15px]">
                Not taking new bookings
              </span>
            )}
          </div>
        </div>

        <ProfileBody practitioner={practitioner} />

        <ProfileFooter />
      </div>

      {!preview && <StickyBookingBar slots={slots} practitionerZone={practitioner.timezone} accepting={practitioner.acceptingBookings} />}
    </main>
  );
}
