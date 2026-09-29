import Link from "next/link";

export function Tabs({
  basePath,
  active,
  items,
}: {
  basePath: string;
  active: string;
  items: { value: string; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-black/[0.03] p-1">
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <Link
            key={item.value}
            href={`${basePath}?tab=${item.value}`}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
            {typeof item.count === "number" && (
              <span className={isActive ? "text-primary" : "text-muted"}>{item.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
