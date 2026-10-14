/**
 * Shown the instant a Super Admin page is opening, while its data loads. It has the same frame as the real pages
 * (header with a rule under it, then a card with a toolbar and rows) so nothing jumps when the page replaces it.
 */
const row = [62, 48, 70, 55, 66, 44, 58, 52];

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div style={{ padding: "32px var(--ml-gutter) 24px" }}>
        <div style={{ paddingBottom: 24, borderBottom: "1px solid rgba(0, 0, 0, 0.07)" }}>
          <div className="skel" style={{ height: 34, width: 260, borderRadius: 8 }} />
          <div className="skel" style={{ height: 16, width: 340, maxWidth: "100%", borderRadius: 6, marginTop: 12 }} />
        </div>
      </div>

      <div style={{ padding: "0 var(--ml-gutter) 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 10, padding: "14px 16px", borderBottom: "1px solid rgba(0, 0, 0, 0.07)", flexWrap: "wrap" }}>
            <div className="skel" style={{ height: 38, width: 260, borderRadius: 8 }} />
            <div className="skel" style={{ height: 38, width: 200, borderRadius: 8 }} />
          </div>
          {row.map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 16px", borderBottom: i === row.length - 1 ? "none" : "1px solid rgba(0, 0, 0, 0.06)" }}>
              <div className="skel" style={{ height: 16, width: `${w}%`, maxWidth: 280, borderRadius: 6 }} />
              <div className="skel hide-md" style={{ height: 16, width: 140, borderRadius: 6 }} />
              <div className="skel hide-sm" style={{ height: 16, width: 200, borderRadius: 6 }} />
              <div className="skel" style={{ height: 16, width: 70, borderRadius: 6, marginLeft: "auto" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
