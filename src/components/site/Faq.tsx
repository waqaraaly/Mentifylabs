"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/components/site/faqItems";

/**
 * The questions, large and bold, in the same style as the feature names in "See every part of it at work.". One is
 * open at a time: it darkens, slides in beside a honey bar, and its answer unfolds underneath. The same list feeds the
 * search-engine markup on the homepage.
 */
export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="scroll-mt-20 border-t border-(--hair) bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16 lg:px-10 lg:py-32">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-medium text-(--leaf-deep)">Questions</p>
          <h2 className="mt-3 text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-(--ink)">Ask away.</h2>
          <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-(--quiet)">The things practitioners usually ask before they make their page.</p>
          <p className="mt-8 text-[15px] text-(--quiet)">
            Something else?{" "}
            <a
              href="mailto:privacy@mentifylabs.com"
              className="font-medium text-(--ink) underline decoration-(--hair) decoration-2 underline-offset-4 transition hover:decoration-(--leaf)"
            >
              privacy@mentifylabs.com
            </a>
          </p>
        </div>

        <div className="border-t border-(--hair)">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.question} className="relative border-b border-(--hair)">
                {/* the honey bar beside the open question */}
                <span
                  aria-hidden
                  className={`absolute top-6 bottom-6 left-0 w-[3px] origin-top rounded-full bg-(--glow) transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
                    isOpen ? "scale-y-100" : "scale-y-0"
                  }`}
                />
                <h3>
                  <button
                    type="button"
                    id={`faq-question-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className={`group flex w-full items-center justify-between gap-5 py-6 text-left text-[clamp(1.2rem,2vw,1.55rem)] leading-snug font-bold tracking-[-0.025em] transition-[color,padding] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
                      isOpen ? "pl-5 text-(--ink)" : "pl-0 text-(--ink)/40 hover:text-(--ink)/70"
                    }`}
                  >
                    {item.question}
                    <span
                      aria-hidden
                      className={`grid size-9 shrink-0 place-items-center rounded-full text-xl leading-none font-normal transition-[transform,background-color,color,box-shadow] duration-300 ${
                        isOpen ? "rotate-45 bg-(--ink) text-white" : "text-(--quiet) shadow-[inset_0_0_0_1px_var(--hair)]"
                      }`}
                    >
                      +
                    </span>
                  </button>
                </h3>

                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[60ch] pb-6 pl-5 text-[17px] leading-relaxed text-(--quiet)">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
