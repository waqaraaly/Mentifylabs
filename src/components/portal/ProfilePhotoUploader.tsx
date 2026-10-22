"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import {
  removeProfilePhotoAction,
  uploadProfilePhotoAction,
} from "@/app/dashboard/profile/actions";

const MAX_DIMENSION = 480;

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function toSquareJpeg(file: File): Promise<Blob> {
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
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Couldn't encode image")),
      "image/jpeg",
      0.86,
    ),
  );
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
    let jpeg: Blob;
    try {
      jpeg = await toSquareJpeg(file);
    } catch {
      setError("Couldn't read that image. Try a different file.");
      return;
    }
    const previous = preview;
    setPreview(URL.createObjectURL(jpeg));
    startTransition(async () => {
      const data = new FormData();
      data.set("slug", slug);
      data.set("photo", new File([jpeg], "photo.jpg", { type: "image/jpeg" }));
      const result = await uploadProfilePhotoAction(data);
      if (result.error) {
        setError(result.error);
        setPreview(previous);
        return;
      }
      router.refresh();
    });
  };

  const handleRemove = () => {
    setPreview(undefined);
    startTransition(async () => {
      await removeProfilePhotoAction(slug);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <button
          id="profile-photo"
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative size-40 shrink-0 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={preview ? "Change profile photo" : "Upload profile photo"}
        >
          <span className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-primary/[0.1] text-5xl font-semibold text-primary shadow-sm ring-1 ring-black/[0.08]">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview or small stored photo, no optimization needed
              <img
                src={preview}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initialsOf(fullName)
            )}
            <span
              aria-hidden
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <Camera className="size-5" />
              {preview ? "Change" : "Upload"}
            </span>
            {pending && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2
                  className="size-8 animate-spin text-white"
                  aria-hidden
                />
              </span>
            )}
          </span>
          <span
            aria-hidden
            className="absolute right-1 bottom-1 flex size-10 items-center justify-center rounded-full bg-surface text-foreground shadow-md ring-1 ring-black/10 transition group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <Camera className="size-[18px]" />
          </span>
        </button>

        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Camera className="size-4" aria-hidden />
              {preview ? "Upload new photo" : "Upload photo"}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={pending}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-alert/[0.08] hover:text-alert disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">JPG, PNG or WebP.</p>
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
