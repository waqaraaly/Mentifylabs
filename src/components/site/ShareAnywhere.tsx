import type { ReactNode } from "react";

const LINK = "mentifylabs.com/dr-ayesha-khan";
const SOURCES = ["Instagram", "WhatsApp", "LinkedIn", "Facebook", "Search"];

function Tile({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-3xl bg-white p-5 shadow-[0_20px_40px_-30px_rgba(31,38,23,0.45)] ring-1 ring-(--sage-edge)">
      <div className="flex min-h-40 flex-1 items-center justify-center rounded-2xl bg-[#f6f8ef] p-4">{children}</div>
      <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.01em]">{label}</h3>
      <p className="mt-1 text-[14.5px] leading-relaxed text-(--quiet)">{note}</p>
    </div>
  );
}

const linkText = "font-mono text-[12px] font-semibold text-(--leaf-deep) underline decoration-(--sage-edge) underline-offset-4 break-all";

/** Where a practitioner can put their link. A plain address works anywhere that takes a link. */
export function ShareAnywhere() {
  return (
    <section id="share" className="scroll-mt-20 bg-(--sage)">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="text-center">
          <p className="text-sm font-medium text-(--leaf-deep)">Sharing</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance text-(--ink)">
            Share your link anywhere you like.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-(--quiet)">
            Your link is a plain web address, so it works wherever you can paste one. It is short enough to say out loud and to print.
          </p>

          <div className="mx-auto mt-9 flex w-fit max-w-full items-center gap-3 rounded-full bg-white py-3 pr-3 pl-6 shadow-[0_18px_36px_-22px_rgba(31,38,23,0.5)] ring-1 ring-(--sage-edge)">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-(--honey)" />
            <p className="min-w-0 truncate font-mono text-[clamp(0.85rem,1.8vw,1.15rem)] text-(--quiet)">
              mentifylabs.com/<span className="font-semibold text-(--ink)">dr-ayesha-khan</span>
            </p>
            <span className="shrink-0 rounded-full bg-(--ink) px-4 py-2 text-[13px] font-medium text-white">Copy link</span>
          </div>
          <p className="mt-3 text-[13px] text-(--quiet)">An example address. You choose yours when you set up.</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Tile label="In your social bio" note="Add it to the link field on Instagram, Facebook or wherever you have a profile.">
            <div className="w-full max-w-[250px] rounded-2xl bg-white p-4 text-[13px] leading-snug ring-1 ring-(--hair)">
              <p className="font-semibold">Dr. Ayesha Khan</p>
              <p className="text-(--quiet)">Clinical Psychologist</p>
              <p className="mt-1 text-(--quiet)">Anxiety · Burnout · Relationships</p>
              <p className={`mt-2 ${linkText}`}>{LINK}</p>
            </div>
          </Tile>

          <Tile label="In a message" note="Paste it into WhatsApp or any chat. Your name and title show in the preview.">
            <div className="w-full max-w-[250px]">
              <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-[#dfe7cb] px-3.5 py-2.5 text-[13px] leading-snug">Here is my page. You can pick a time.</p>
              <div className="mt-2 ml-auto w-[90%] rounded-2xl rounded-br-md bg-[#dfe7cb] p-1.5">
                <div className="flex items-center gap-2.5 rounded-xl bg-white p-2.5">
                  <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--sage) text-[11px] font-semibold text-(--moss)">
                    AK
                  </span>
                  <div className="min-w-0 text-[12px] leading-tight">
                    <p className="truncate font-semibold">Dr. Ayesha Khan</p>
                    <p className="truncate text-(--quiet)">Clinical Psychologist</p>
                    <p className="truncate text-(--quiet)">mentifylabs.com</p>
                  </div>
                </div>
              </div>
            </div>
          </Tile>

          <Tile label="In your email signature" note="Put it under your name so every email you send points clients to your page.">
            <div className="w-full max-w-[250px] rounded-2xl bg-white p-4 text-[13px] leading-snug ring-1 ring-(--hair)">
              <p className="text-(--quiet)">Warm regards,</p>
              <p className="mt-2 font-semibold">Dr. Ayesha Khan</p>
              <p className="text-(--quiet)">Clinical Psychologist</p>
              <p className={`mt-1.5 ${linkText}`}>{LINK}</p>
            </div>
          </Tile>

          <Tile label="On your professional profile" note="Add it as your website on LinkedIn or any directory that lists one.">
            <div className="w-full max-w-[250px] rounded-2xl bg-white p-4 text-[13px] ring-1 ring-(--hair)">
              <p className="text-[11px] font-semibold tracking-wider text-(--quiet) uppercase">Contact info</p>
              <p className="mt-2 text-(--quiet)">Website</p>
              <p className={linkText}>{LINK}</p>
              <p className="text-[11.5px] text-(--quiet)">Personal</p>
            </div>
          </Tile>

          <Tile label="On a printed card" note="Short and lowercase, so it is easy to read off a card, a brochure or a clinic door.">
            <div className="w-full max-w-[250px] rotate-[-2deg] rounded-xl bg-white p-4 shadow-[0_14px_26px_-16px_rgba(31,38,23,0.5)] ring-1 ring-(--hair)">
              <p className="text-[15px] font-semibold tracking-[-0.01em]">Dr. Ayesha Khan</p>
              <p className="text-[12px] text-(--quiet)">Clinical Psychologist</p>
              <div className="mt-6 flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full bg-(--honey)" />
                <p className="font-mono text-[10.5px] font-semibold whitespace-nowrap">{LINK}</p>
              </div>
            </div>
          </Tile>

          <Tile label="On your own website" note="Link a button or a line of text to it from a clinic site, a blog or a directory listing.">
            <div className="w-full max-w-[250px] rounded-2xl bg-white p-4 text-center ring-1 ring-(--hair)">
              <p className="text-[13px] text-(--quiet)">Ready to talk?</p>
              <span className="mt-3 inline-block rounded-full bg-(--ink) px-5 py-2.5 text-[13px] font-medium text-white">Pick a time</span>
              <p className={`mt-3 ${linkText}`}>{LINK}</p>
            </div>
          </Tile>
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-3xl bg-white/70 px-6 py-6 text-center ring-1 ring-(--sage-edge)">
          <p className="text-[17px] font-semibold tracking-[-0.01em]">See which one brings people in.</p>
          <p className="mt-1 text-[15px] leading-relaxed text-(--quiet)">Your stats show where your visitors come from, so you can tell what is working.</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Sources shown in your stats">
            {SOURCES.map((source) => (
              <li key={source} className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium ring-1 ring-(--hair)">
                {source}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
