"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThemedSelect } from "@/components/ui/ThemedSelect";

export interface RangeOption {
  value: number;
  label: string;
  href: string;
}

/** The time-range filter as a dropdown. Choosing a range opens that range's page, so it can be linked and survives a refresh. */
export function RangeSelect({ value, options }: { value: number; options: RangeOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className={`transition-opacity ${pending ? "opacity-60" : ""}`}>
      <ThemedSelect
        ariaLabel="Time range"
        align="right"
        value={String(value)}
        options={options.map((o) => ({ value: String(o.value), label: o.label }))}
        onChange={(v) => {
          const next = options.find((o) => String(o.value) === v);
          if (next) startTransition(() => router.push(next.href));
        }}
      />
    </div>
  );
}
