import { initialsOf } from "@/lib/admin";

/** A practitioner's own photo when they have one, otherwise their initials. */
export function Avatar({
  name,
  size = "md",
  photoUrl,
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  photoUrl?: string;
}) {
  return (
    <div
      className={`avatar avatar-${size}`}
      style={{ background: "var(--ml-accent-soft)", color: "var(--ml-accent-2)", borderColor: "transparent", fontWeight: 600 }}
      title={name}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- already-cropped square from our own /media route
        <img src={photoUrl} alt={`Photo of ${name}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        initialsOf(name)
      )}
    </div>
  );
}
