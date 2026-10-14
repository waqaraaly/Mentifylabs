import Link from "next/link";

// One line-icon set, drawn the same way everywhere: 24 grid, 1.75 stroke, round caps.
const ICON = "size-5 fill-none stroke-(--leaf-deep) stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]";

const PLACES = [
  { name: "LinkedIn", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" /></> },
  { name: "WhatsApp", icon: <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-5 4v-4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /> },
  { name: "Instagram", icon: <><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.6 7.2" /></> },
  { name: "Email", icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></> },
];

const PROMISES = [
  { title: "One link", body: "Yours, and easy to remember and type." },
  { title: "Any place", body: "Messages, bios, signatures and print." },
  { title: "You decide", body: "Clients ask for a time. You accept or reply." },
];

/**
 * A deep green band after "Who it is for": the practitioner has one personal link and can put it anywhere clients find
 * them. Copy and three short promises on the left, and a white "your link" panel on the right (a sample link, so the panel
 * is decorative and hidden from screen readers). It says only what the app does: a personal link, and clients asking for a
 * time without an account.
 */
export function ShareLink() {
  return (
    <section id="your-link" className="scroll-mt-20 bg-(--moss-deep) py-20 text-[#f4f1e3] lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-20 lg:px-10">
        <div>
          <p className="text-sm font-semibold tracking-[0.02em] text-[#b9c9a2]">Share your link</p>
          <h2 className="mt-3.5 max-w-[14ch] text-[clamp(2.2rem,4.2vw,3.4rem)] leading-[1.06] font-semibold tracking-[-0.04em] text-balance text-[#fbf8ec]">
            Share one link. Get the inquiries.
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-[#f4f1e3]/75">
            Put your personal link in your bio, your messages and your signature. Clients find your page from wherever they are and ask for a session.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-full bg-(--glow) px-6 py-3.5 text-[15px] font-medium text-(--ink) transition hover:brightness-95">
              Create your page
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full px-6 py-3.5 text-[15px] font-medium text-[#fbf8ec] shadow-[inset_0_0_0_1px_rgba(244,241,227,0.35)] transition hover:bg-white/5"
            >
              See how it works
            </Link>
          </div>

          <div className="mt-11 grid gap-6 border-t border-[#f4f1e3]/20 pt-7 sm:grid-cols-3">
            {PROMISES.map((p) => (
              <div key={p.title}>
                <p className="text-base font-semibold">{p.title}</p>
                <p className="mt-1.5 text-[14.5px] leading-normal text-[#f4f1e3]/65">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div aria-hidden className="rounded-[18px] bg-white p-7 text-(--ink) shadow-[0_40px_70px_-40px_rgba(0,0,0,0.6)]">
          <p className="text-[13px] font-semibold text-(--quiet)">Your personal link</p>
          <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl py-2 pr-2 pl-4 text-base shadow-[inset_0_0_1px_1px_#cfcbb9]">
            <span className="truncate font-mono text-[0.9em]">mentifylabs.com/sara-malik</span>
            <span className="shrink-0 rounded-[9px] bg-(--ink) px-4 py-2.5 text-sm font-medium text-white">Copy link</span>
          </div>

          <p className="mt-6 text-[13px] font-semibold text-(--quiet)">Use it on</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {PLACES.map((p) => (
              <div key={p.name} className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium shadow-[inset_0_0_0_1px_var(--hair)]">
                <svg viewBox="0 0 24 24" className={ICON}>{p.icon}</svg>
                {p.name}
              </div>
            ))}
          </div>

          <div className="mt-5.5 flex items-center gap-3 border-t border-(--hair) pt-4.5 text-sm text-(--quiet)">
            <svg viewBox="0 0 24 24" className={`${ICON} shrink-0`}>
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            It always opens your current page and open times.
          </div>
        </div>
      </div>
    </section>
  );
}
