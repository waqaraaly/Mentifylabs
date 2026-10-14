import Link from "next/link";
import { ClaimField } from "@/components/site/ClaimField";

/** The closing call to action: a name field that shows the address it would make, and a way back in for existing accounts. */
export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 text-center lg:px-10 lg:py-28">
      <h2 className="mx-auto max-w-2xl text-[clamp(2rem,4.4vw,3.3rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-balance text-(--ink)">
        Claim your link and make your page.
      </h2>
      <p className="mx-auto mt-5 mb-9 max-w-md text-lg leading-relaxed text-(--quiet)">Setup takes a few short steps, and you can finish your profile later.</p>

      <ClaimField />

      <p className="mt-7 text-[15px] text-(--quiet)">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-(--ink) underline decoration-(--hair) decoration-2 underline-offset-[6px] transition hover:decoration-(--leaf)">
          Log in
        </Link>
      </p>
    </section>
  );
}
