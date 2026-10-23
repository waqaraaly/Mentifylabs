/**
 * The hero's right side, told as one loop: a practitioner's verified page, a client picking a time and requesting it,
 * and the request arriving for the practitioner to accept, after which the time reads "Booked". The motion is pure CSS
 * (see the .hs rules in globals.css) and stops for visitors who prefer less motion. Decorative, so it is hidden from
 * screen readers. The people and times are samples.
 */
const SLOTS = ["Mon 10:00", "Tue 4:00 PM", "Wed 11:30", "Thu 6:00 PM", "Fri 12:00", "Sat 10:00"];

const SHIELD = (
  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 4 6v6c0 4.5 3.3 7.8 8 9 4.7-1.2 8-4.5 8-9V6z" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
);

export function HeroStory() {
  return (
    <div aria-hidden className="hs">
      <div className="hs-page">
        <div className="hs-cover" />
        <div className="hs-who">
          <div className="hs-av">SM</div>
          <h3 className="hs-name">
            Dr. Sara Malik
            <svg viewBox="0 0 24 24" className="size-[18px]" style={{ color: "#3f4e30" }}>
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path d="m6.5 12.5 4 4 7-8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </h3>
        </div>
        <div className="hs-role">Counselling psychologist · Lahore</div>
        <div className="hs-chips">
          <span>Anxiety</span>
          <span>Self-esteem</span>
          <span>Young adults</span>
        </div>
        <div className="hs-lab">Open this week</div>
        <div className="hs-slots">
          {SLOTS.map((s, i) => (
            <div key={s} className={`hs-slot${i === 1 ? " pick" : ""}`}>
              {s}
            </div>
          ))}
        </div>
        <div className="hs-req">
          <div className="a">Request a session</div>
          <div className="b">Request sent ✓</div>
          <div className="c">Booked for Tue 4:00 PM</div>
        </div>
      </div>

      <div className="hs-badge">
        <span style={{ color: "#2f7a4a" }}>{SHIELD}</span>
        Credentials verified
      </div>

      <div className="hs-notif">
        <div className="t">
          <i />
          New request
        </div>
        <div className="n">Ayesha K.</div>
        <div className="d">Tue 4:00 PM · Online</div>
        <div className="act">
          <span className="acc">Accept</span>
          <span className="dec">Decline</span>
        </div>
      </div>
    </div>
  );
}
