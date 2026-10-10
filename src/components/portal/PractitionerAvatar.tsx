"use client";

import { useState } from "react";

/** The first letters of up to two words of a name. */
function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * A round picture of the practitioner: the photo they uploaded for their public profile when there is one, and the
 * initials of their name otherwise, or if the photo cannot be loaded.
 */
export function PractitionerAvatar({ name, photoUrl, className = "size-10" }: { name: string; photoUrl?: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- already-cropped square from our own /media route
      <img
        src={photoUrl}
        alt={`Photo of ${name}`}
        onError={() => setFailed(true)}
        className={`${className} ring-sidebar-border shrink-0 rounded-full object-cover ring-1`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${name}'s initials`}
      className={`${className} ring-sidebar-border bg-sidebar-active text-sidebar-active-fg flex shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1`}
    >
      {initialsOf(name)}
    </span>
  );
}
