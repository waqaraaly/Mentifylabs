/**
 * The hero's right side: the booking, live. A client picks a time on a practitioner's page and presses Request, the
 * request lands in the practitioner's list, a second cursor accepts it, and the time on the page turns to "Booked".
 * It loops every twelve seconds. The animation is pure CSS (see the .hb rules in globals.css) and stops for visitors who
 * prefer less motion. Decorative, so hidden from screen readers. The people and times are samples.
 */
const SLOTS: { label: string; left: string; top: string; pick?: boolean }[] = [
  { label: "Mon 10:00", left: "3.4cqw", top: "44cqw" },
  { label: "Tue 16:00", left: "31.7cqw", top: "44cqw", pick: true },
  { label: "Wed 11:30", left: "3.4cqw", top: "51.4cqw" },
  { label: "Thu 18:00", left: "31.7cqw", top: "51.4cqw" },
  { label: "Fri 12:00", left: "3.4cqw", top: "58.8cqw" },
  { label: "Sat 10:00", left: "31.7cqw", top: "58.8cqw" },
];

function Pointer({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ color }} aria-hidden>
      <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.2 L17.5 13 Z" fill="currentColor" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function HeroBooking() {
  return (
    <div aria-hidden className="hb">
      {/* the practitioner's page */}
      <div className="abs card pf">
        <div className="abs cov" />
        <div className="abs av">SM</div>
        <div className="abs nm">
          Dr. Sara Malik
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ color: "#3f4e30" }}>
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path d="m6 12.5 4 4 8-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="abs rl">Counselling psychologist · Lahore</div>
        <div className="abs chips">
          <span>Anxiety</span>
          <span>Self-esteem</span>
          <span>Young adults</span>
        </div>
        <div className="abs lab">Open this week</div>
        {SLOTS.map((s) => (
          <div key={s.label} className={`abs slot${s.pick ? " pick" : ""}`} style={{ left: s.left, top: s.top }}>
            {s.label}
          </div>
        ))}
        <div className="abs btn1">Request a session</div>
        <div className="abs btn2">Request sent ✓</div>
      </div>

      {/* the practitioner's request list */}
      <div className="abs card rq">
        <h4>Requests</h4>
        <div className="item i1">
          <div className="who">
            <i>AK</i>
            <div>
              <b>Ayesha K.</b>
              <small>Mon 10:00 · online</small>
            </div>
          </div>
          <span className="badge bg-ok">Booked</span>
        </div>
        <div className="item ph">Waiting for requests…</div>
        <div className="item i2">
          <div className="who">
            <i>RA</i>
            <div>
              <b>Rabia A.</b>
              <small>Tue 16:00 · online</small>
            </div>
          </div>
          <span className="badge bg-new">New</span>
          <span className="badge bg-bk">Booked</span>
          <div className="acts">
            <span className="ac">Accept</span>
            <span className="vw">View</span>
          </div>
          <div className="rip" />
        </div>
      </div>

      {/* the client's cursor, then the practitioner's */}
      <div className="abs cur">
        <Pointer color="#e7a93b" />
        <span style={{ background: "#e7a93b", color: "#1f2617" }}>Rabia</span>
      </div>
      <div className="abs cur cur2">
        <Pointer color="#1f2617" />
        <span style={{ background: "#1f2617" }}>Dr. Sara</span>
      </div>
    </div>
  );
}
