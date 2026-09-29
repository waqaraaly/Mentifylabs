"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { updateProfilePhotoAction } from "@/app/dashboard/profile/actions";

const MAX_DIMENSION = 480;

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function toSquareDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const dim = Math.min(MAX_DIMENSION, side);

  const canvas = document.createElement("canvas");
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, dim, dim);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export function ProfilePhotoUploader({
  slug,
  fullName,
  photoUrl,
}: {
  slug: string;
  fullName: string;
  photoUrl?: string;
}) {
  const [preview, setPreview] = useState(photoUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    try {
      const dataUrl = await toSquareDataUrl(file);
      setPreview(dataUrl);
      startTransition(async () => {
        await updateProfilePhotoAction(slug, dataUrl);
        router.refresh();
      });
    } catch {
      setError("Couldn't read that image — try a different file.");
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    startTransition(async () => {
      await updateProfilePhotoAction(slug, null);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-5">
        <button
          id="profile-photo"
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/[0.1] text-2xl font-semibold text-primary ring-1 ring-black/[0.06] transition hover:ring-primary/40"
          aria-label={preview ? "Change profile photo" : "Upload profile photo"}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URL, no optimization needed
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(fullName)
          )}
          {pending && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-5 animate-spin text-white" aria-hidden />
            </span>
          )}
        </button>

        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            >
              <Camera className="size-4" aria-hidden />
              {preview ? "Change photo" : "Upload photo"}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={pending}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-alert/[0.08] hover:text-alert disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">JPG or PNG. It&apos;s cropped to a square automatically.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-2 text-xs text-alert">{error}</p>}
    </div>
  );
}