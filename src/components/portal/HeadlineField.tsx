"use client";

import { useState } from "react";
import { settingsInputClass } from "@/components/portal/SettingsRow";

/**
 * The headline: one line under the name. It stops at `max` characters and shows how many are used. A headline saved
 * before the limit existed keeps all its text and can be shortened, but cannot be made longer.
 */
export function HeadlineField({
  initial,
  max,
}: {
  initial: string;
  max: number;
}) {
  const [value, setValue] = useState(initial);
  const over = value.length > max;

  return (
    <div>
      <input
        id="shortBio"
        name="shortBio"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          // Growing past the limit is refused; shortening a longer, older headline is always allowed.
          if (next.length > max && next.length > value.length) return;
          setValue(next);
        }}
        placeholder="e.g. Clinical psychologist working with adults and couples."
        aria-describedby="shortBio-count"
        className={settingsInputClass}
      />
      <p
        id="shortBio-count"
        className={`mt-1.5 text-right text-xs tabular-nums ${over ? "text-alert" : "text-muted"}`}
      >
        {value.length} / {max}
        {over && " (over the limit; shorten it when you can)"}
      </p>
    </div>
  );
}
