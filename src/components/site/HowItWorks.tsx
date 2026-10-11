const STEPS = [
  {
    title: "Create your account",
    body: "Sign up with your email and confirm it with the link we send you.",
    circle: "bg-(--sage) text-(--ink)",
  },
  {
    title: "Build your page",
    body: "Add your title, your areas of expertise, a photo and the times you see clients. Choose your own link and a colour theme.",
    circle: "bg-(--glow) text-(--ink)",
  },
  {
    title: "Get verified and share",
    body: "Upload a license, degree or membership. Our team reviews your profile before it goes live, and then your link is ready to share.",
    circle: "bg-(--leaf) text-white",
  },
];

/** The three steps from sign-up to a live page: numbered circles joined by a dashed path. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-7xl scroll-mt-20 px-6 py-20 lg:px-10 lg:py-28">
      <div className="text-center">
        <p className="text-sm font-medium text-(--leaf-deep)">How it works</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance text-(--ink)">
          From sign-up to a live page in three steps.
        </h2>
      </div>

      <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-10">
        {/* The dashed path runs behind the circles, from the first to the last. */}
        <span aria-hidden className="absolute top-9 right-[16%] left-[16%] hidden border-t-2 border-dashed border-(--sage-edge) md:block" />
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative text-center">
            <span className={`relative mx-auto flex size-[72px] items-center justify-center rounded-full text-2xl font-bold tabular-nums ring-8 ring-white ${step.circle}`}>{i + 1}</span>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
            <p className="mx-auto mt-2 max-w-[32ch] text-[15px] leading-relaxed text-(--quiet)">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
