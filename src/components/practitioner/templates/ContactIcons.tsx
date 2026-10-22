"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Mail, Phone, X } from "lucide-react";

type Kind = "email" | "phone";

const COPY: Record<Kind, { title: string; action: string }> = {
  email: { title: "Email", action: "Send an email" },
  phone: { title: "Phone", action: "Call" },
};

/**
 * Email and phone as two icons for the row of links. Pressing one opens a small window with the details, a button that
 * opens the mail app or the dialler, and a button that copies the text.
 */
export function ContactIcons({
  email,
  phone,
}: {
  email?: { value: string; href: string };
  phone?: { value: string; href: string };
}) {
  const [open, setOpen] = useState<Kind | null>(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const shown = open === "email" ? email : open === "phone" ? phone : undefined;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const copy = async () => {
    if (!shown) return;
    try {
      await navigator.clipboard.writeText(shown.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // The browser can refuse clipboard access; the text is on screen to select.
    }
  };

  const iconButton =
    "grid size-11 cursor-pointer place-items-center rounded-[10px] text-(--pt-muted) transition-colors duration-150 hover:bg-(--pt-tint-strong) hover:text-(--pt-text)";

  return (
    <>
      {email && (
        <button
          type="button"
          aria-label="Show email"
          aria-haspopup="dialog"
          onClick={() => setOpen("email")}
          className={iconButton}
        >
          <Mail className="size-[22px]" strokeWidth={1.75} aria-hidden />
        </button>
      )}
      {phone && (
        <button
          type="button"
          aria-label="Show phone number"
          aria-haspopup="dialog"
          onClick={() => setOpen("phone")}
          className={iconButton}
        >
          <Phone className="size-[22px]" strokeWidth={1.75} aria-hidden />
        </button>
      )}

      <dialog
        ref={ref}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(null);
        }}
        aria-labelledby="contact-title"
        className="m-auto w-[calc(100%-1.25rem)] max-w-sm overflow-hidden rounded-[22px] border border-(--pt-border) bg-(--pt-bg) p-0 text-(--pt-text) shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm sm:w-full"
      >
        {open && shown && (
          <div className="relative px-7 py-8">
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="absolute top-3.5 right-3.5 grid size-9 cursor-pointer place-items-center rounded-full text-(--pt-muted) transition hover:bg-black/5 hover:text-(--pt-text)"
            >
              <X className="size-5" aria-hidden />
            </button>
            <span className="grid size-12 place-items-center rounded-full bg-(--pt-tint-strong) text-(--pt-accent-text)">
              {open === "email" ? (
                <Mail className="size-6" aria-hidden />
              ) : (
                <Phone className="size-6" aria-hidden />
              )}
            </span>
            <h3
              id="contact-title"
              className="mt-4 text-sm font-semibold tracking-wide text-(--pt-muted) uppercase"
            >
              {COPY[open].title}
            </h3>
            <p className="mt-1 text-xl font-semibold break-all select-all">
              {shown.value}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <a
                href={shown.href}
                className="inline-flex items-center justify-center rounded-(--pt-btn,0.75rem) bg-(--pt-accent) px-5 py-2.5 text-sm font-semibold text-(--pt-accent-foreground) transition hover:bg-(--pt-accent-hover)"
              >
                {COPY[open].action}
              </a>
              <button
                type="button"
                onClick={copy}
                className="inline-flex cursor-pointer items-center gap-2 rounded-(--pt-btn,0.75rem) px-5 py-2.5 text-sm font-semibold shadow-[inset_0_0_0_1.5px_var(--pt-border)] transition hover:shadow-[inset_0_0_0_1.5px_var(--pt-text)]"
              >
                {copied ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
