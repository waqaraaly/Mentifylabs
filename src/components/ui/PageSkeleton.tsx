const block = "animate-pulse rounded-xl bg-black/[0.06]";

/** Route-level loading fallback for the portals: a wireframe of the usual page
 * (heading, stat tiles, list) so the layout appears instantly and fills in. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2">
        <div className={`${block} h-8 w-56`} />
        <div className={`${block} h-4 w-80 max-w-full`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${block} h-28`} />
        ))}
      </div>
      <div className="space-y-3 rounded-2xl bg-surface p-6 ring-1 ring-black/[0.04]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-12`} />
        ))}
      </div>
    </div>
  );
}
