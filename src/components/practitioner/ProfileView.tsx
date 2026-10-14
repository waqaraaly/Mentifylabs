import Link from "next/link";
import { Eye } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Slot } from "@/types/slot";
import { DEFAULT_COLOR_THEME } from "@/lib/themes";
import { ProfileBody } from "@/components/practitioner/ProfileBody";
import { ProfileFooter } from "@/components/practitioner/ProfileFooter";
import { StickyBookingBar } from "@/components/practitioner/StickyBookingBar";
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
      // The frame is the same width on every side. The page inside grows to fill the screen, so a short profile does not
      // leave a wide band of frame colour at the bottom.
      className="flex min-h-screen flex-col bg-(--pt-outer) p-[7.5px] sm:p-[16.5px]"
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

      <div className="flex flex-1 flex-col overflow-hidden rounded-[36px] bg-(--pt-bg) text-(--pt-text)">
        <StructuredData practitioner={practitioner} />

        {!preview && <ProfileViewTracker slug={practitioner.slug} />}

        {!preview && practitioner.acceptingBookings && <BookingModal practitioner={practitioner} slots={slots} />}

        {/* A plain full-width wrapper: the page is a flex column, and the sections inside have auto side margins, which would shrink them. */}
        <div className="w-full">
          <ProfileBody practitioner={practitioner} />
        </div>

        {/* The footer follows the last section after a fixed gap, whatever the screen height. The floating booking bar rests
            over the page, so the room for it is inside the page, under the footer, not in the frame. */}
        <div className={preview ? "" : "pb-20"}>
          <ProfileFooter />
        </div>
      </div>

      {!preview && <StickyBookingBar slots={slots} practitionerZone={practitioner.timezone} accepting={practitioner.acceptingBookings} />}
    </main>
  );
}
