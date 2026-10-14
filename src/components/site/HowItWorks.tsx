"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// The real order of things: publishing waits for the credentials to be approved.
const STEPS = [
  { title: "Quick setup", body: "Sign up with your email, then tell us your name, your title, how you see clients and your time zone." },
  { title: "Choose your link", body: "Pick the address you will share. We check it is free as you type, and you can change it later." },
  { title: "Get verified", body: "Upload a license, degree or membership. A person on our team reads it, and your page earns its badge." },
  { title: "Fill in your page", body: "Add a few lines about your work, the areas you help with and a photo, then open the times you are free." },
  { title: "Publish and share", body: "Put your page live and share your link. Clients pick a time and send a request, and you accept it." },
];

// Each step stands a little taller than the one before it, so the row reads as a staircase.
const HEIGHTS = ["lg:min-h-[230px]", "lg:min-h-[270px]", "lg:min-h-[310px]", "lg:min-h-[350px]", "lg:min-h-[400px]"];

/**
 * How it works, as a staircase: five cards that rise one after another, each a step higher than the last, up to a
 * honey card that ends on "Your first booking." They are always visible; when the section comes into view they climb
 * into place one after another.
 */
export function HowItWorks() {
  const list = useRef<HTMLOListElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          watch.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-medium text-(--leaf-deep)">How it works</p>
            <h2 className="mt-3 max-w-[16ch] text-[clamp(2.2rem,4.6vw,3.7rem)] leading-[1.03] font-semibold tracking-[-0.045em] text-balance text-(--ink)">
              Five steps up to your first booking.
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-[42ch] text-lg leading-relaxed text-(--quiet)">You can save and come back at any point, and nothing goes live until you publish.</p>
            <Link href="/signup" className="mt-6 inline-flex rounded-full bg-(--ink) px-6 py-3 text-[15px] font-medium text-white transition hover:bg-(--moss)">
              Start with step one
            </Link>
          </div>
        </div>

        <ol ref={list} className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          {STEPS.map((step, i) => {
            const last = i === STEPS.length - 1;
            return (
              <li
                key={step.title}
                className={`flex flex-col rounded-3xl p-6 ${HEIGHTS[i]} ${
                  last ? "bg-(--glow) sm:col-span-2 lg:col-span-1" : "bg-[#faf8f1] ring-1 ring-(--hair) ring-inset"
                } ${seen ? "motion-safe:animate-[climb_.7s_cubic-bezier(.2,.8,.2,1)_both]" : ""}`}
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <span className={`text-[13px] font-semibold ${last ? "text-(--honey-text)" : "text-(--leaf-deep)"}`}>Step {i + 1}</span>
                <h3 className="mt-2 text-[20px] leading-tight font-bold tracking-[-0.025em] text-(--ink)">{step.title}</h3>
                <p className={`mt-2 text-[14.5px] leading-relaxed ${last ? "text-[#4a3d14]" : "text-(--quiet)"}`}>{step.body}</p>
                {last && <p className="mt-auto pt-6 text-[clamp(1.6rem,2.4vw,2rem)] leading-none font-extrabold tracking-[-0.04em] text-(--ink)">Your first booking.</p>}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
