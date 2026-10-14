import { zoneTag } from "@/lib/time";

/** "America/New_York" as "New York", for a sentence. */
export const friendlyZone = (zone: string) => (zone.split("/").pop() ?? zone).replace(/_/g, " ");

/**
 * Says which clock the times on this page are on. Online sessions follow the visitor's own device, so they read in
 * the visitor's time with no setup; a session in person is where the practitioner is, so it stays on the
 * practitioner's clock. It only states the zone: there is nothing to change.
 */
export function ViewerTimeZoneNote({
  format,
  practitionerZone,
  viewerZone,
}: {
  format: "online" | "offline" | null;
  practitionerZone: string;
  viewerZone: string;
}) {
  if (format === "offline") {
    return (
      <p className="text-sm text-(--pt-muted)">
        Sessions on-site are at {friendlyZone(practitionerZone)} time ({zoneTag(practitionerZone)}), where the practitioner is.
      </p>
    );
  }

  return (
    <p className="text-sm text-(--pt-muted)">
      Times shown in {friendlyZone(viewerZone)} ({zoneTag(viewerZone)})
    </p>
  );
}
