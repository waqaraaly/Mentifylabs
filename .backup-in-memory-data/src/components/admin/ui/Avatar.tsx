import { initialsOf } from "@/lib/admin";

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
      style={{ background: "var(--zf-accent-soft)", color: "var(--zf-accent-2)", borderColor: "transparent", fontWeight: 600 }}
      title={name}
    >
      {initialsOf(name)}
    </div>
  );
}
