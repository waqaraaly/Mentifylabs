import { avatarTone, initialsOf } from "@/lib/admin";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={`avatar avatar-${size}`}
      style={{ background: avatarTone(name) }}
      title={name}
    >
      {initialsOf(name)}
    </div>
  );
}
