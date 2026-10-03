"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";
import { unpublishProfileAction } from "@/app/dashboard/profile/actions";
import { ConfirmDialog } from "@/components/portal/ConfirmDialog";

/** Takes the practitioner's own profile offline, after a confirmation. They can publish it again at any time. */
export function UnpublishProfileButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await unpublishProfileAction(slug);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-foreground ring-1 ring-black/[0.14] transition hover:bg-black/[0.04]"
      >
        <EyeOff className="size-4" aria-hidden />
        Unpublish
      </button>

      {open && (
        <ConfirmDialog
          title="Take your profile offline?"
          description={
            error ??
            "Clients won't be able to find your profile or book you until you publish it again. You can do that whenever you like."
          }
          confirmLabel="Unpublish"
          tone="danger"
          pending={pending}
          onConfirm={confirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
