"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard access can be denied by the browser; fail silently.
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 py-1.5 text-sm font-medium transition hover:bg-black/[0.07]"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-success" aria-hidden />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden />
          Copy link
        </>
      )}
    </button>
  );
}
