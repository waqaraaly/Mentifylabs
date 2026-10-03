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
    <div className="flex w-full gap-1 overflow-x-auto rounded-full bg-black/[0.03] p-1 sm:inline-flex sm:w-auto">
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <Link
            key={item.value}
            href={`${basePath}?tab=${item.value}`}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition sm:flex-none sm:px-3.5 ${
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
