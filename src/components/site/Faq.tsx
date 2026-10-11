export const FAQ_ITEMS = [
  {
    question: "Do my clients need an account?",
    answer: "No. A client picks one of your open times and sends a request. They never have to sign up.",
  },
  {
    question: "Can I choose my own link?",
    answer: "Yes. Your link can be 3 to 30 characters, using lowercase letters, numbers and single hyphens, as long as nobody else has it. We check it as you type.",
  },
  {
    question: "Can I change my link later?",
    answer: "Yes, from your dashboard. The old link stops working straight away, so update it anywhere you have shared it.",
  },
  {
    question: "How does verification work?",
    answer: "You upload one or more documents: a license, a degree, a professional membership, an experience letter or something else. Someone on our team reads them, and your page earns a badge beside your name.",
  },
  {
    question: "What time do clients see?",
    answer: "Online sessions show in each visitor's own time zone, and they can change it. Sessions in person stay on your clock.",
  },
  {
    question: "Is what clients write kept private?",
    answer: "Yes. What a client writes about why they are coming is never shown on your page.",
  },
  {
    question: "Can I take my page offline?",
    answer: "Yes, whenever you need to. You decide when your page is visible.",
  },
];

/**
 * The questions as a conversation: the visitor's question on the right, our answer on the left. Each one opens and
 * closes, and the first is open. The same list feeds the search-engine markup on the homepage.
 */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-y border-(--hair) bg-[#f6f8ef]">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <p className="text-sm font-medium text-(--leaf-deep)">Questions</p>
        <h2 className="mt-3 max-w-xl text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance text-(--ink)">Ask away.</h2>

        <div className="mx-auto mt-12 grid max-w-3xl gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <details key={item.question} open={i === 0} className="group grid gap-2">
              <summary className="flex max-w-[88%] cursor-pointer list-none items-center gap-3 justify-self-end rounded-[22px] rounded-br-md bg-(--ink) px-[18px] py-3 text-base font-medium text-white transition hover:bg-(--moss) marker:content-none [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden className="text-lg leading-none opacity-70 transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="flex max-w-[88%] items-end gap-2.5 justify-self-start">
                <span aria-hidden className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-(--leaf) text-[13px] font-semibold text-white">
                  m
                </span>
                <p className="rounded-[22px] rounded-bl-md bg-white px-[18px] py-3.5 text-[15px] leading-relaxed text-(--ink) ring-1 ring-(--hair)">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
