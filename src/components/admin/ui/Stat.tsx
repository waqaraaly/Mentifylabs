/**
 * The headline numbers for a page, in one card: each figure under a plain heading, the columns split by hairlines.
 * One surface instead of a row of separate boxes, so the headings carry the structure.
 */
export function KPIStrip({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="card kpi-strip">
      {items.map((item) => (
        <div key={item.label} className="kpi-cell">
          <div className="kpi-heading">{item.label}</div>
          <div className="tnum kpi-figure">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
