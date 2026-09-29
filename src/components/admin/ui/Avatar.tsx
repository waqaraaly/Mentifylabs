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
      style={{ background: "var(--ml-accent-soft)", color: "var(--ml-accent-2)", borderColor: "transparent", fontWeight: 600 }}
      title={name}
    >
      {initialsOf(name)}
    </div>
  );
}
