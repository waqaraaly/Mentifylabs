"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";

/**
 * The practitioner's public address, in full, with the two things they do with it: copy it and open it.
 */
export function PublicLinkBar({ host, slug }: { host: string; slug: string }) {
  const display = `${host}/${slug}`;
  const url = `https://${display}`;

  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // An older browser, or no permission: select the text in a hidden field and copy that.
      const field = document.createElement("textarea");
      field.value = url;
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(field);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const iconButton =
    "inline-flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-black/[0.05] hover:text-foreground";

  return (
    <div className="flex w-full min-w-0 items-center gap-1 rounded-xl sm:w-auto sm:max-w-full bg-surface py-1.5 pr-1.5 pl-4 ring-1 ring-black/[0.08]">
      <span className="mr-2 min-w-0 flex-1 truncate text-sm sm:flex-none" title={display}>
        <span className="text-muted">{host}/</span>
        <span className="font-semibold">{slug}</span>
      </span>

      <span className="mx-0.5 h-5 w-px shrink-0 bg-black/[0.1]" aria-hidden />

      <button type="button" onClick={copy} className={iconButton} aria-label={copied ? "Link copied" : "Copy link"} title={copied ? "Copied" : "Copy link"}>
        {copied ? <Check className="size-4 text-primary" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>

      <a
        href={`/${slug}`}
        target="_blank"
        rel="noopener"
        className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        Open
        <ArrowUpRight className="size-3.5" aria-hidden />
      </a>
    </div>
  );
}
