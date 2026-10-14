import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookings } from "@/components/site/Bookings";
import { FeatureVisual } from "@/components/site/FeatureVisual";
import { FinalCta } from "@/components/site/FinalCta";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { FEATURE_PAGES, featureBySlug } from "@/lib/featurePages";
import { siteConfig } from "@/lib/site";

// The same face as the homepage.
const outfit = Outfit({ subsets: ["latin"] });

export function generateStaticParams() {
  return FEATURE_PAGES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: PageProps<"/features/[slug]">): Promise<Metadata> {
  const feature = featureBySlug((await params).slug);
  if (!feature) return {};
  const title = `${feature.name} · ${siteConfig.name}`;
  return {
    title: { absolute: title },
    description: feature.description,
    alternates: { canonical: `/features/${feature.slug}` },
    openGraph: { type: "website", url: `/features/${feature.slug}`, siteName: siteConfig.name, title, description: feature.description },
    twitter: { card: "summary", title, description: feature.description },
  };
}

/**
 * One feature, told from the practitioner's side: it opens with the problem they already have, as a question, answers
 * it beside the usual way (crossed out) and a working picture of the feature, then answers what people ask about it.
 */
export default async function FeaturePage({ params }: PageProps<"/features/[slug]">) {
  const feature = featureBySlug((await params).slug);
  if (!feature) notFound();

  const index = FEATURE_PAGES.indexOf(feature);
  const previous = FEATURE_PAGES[(index - 1 + FEATURE_PAGES.length) % FEATURE_PAGES.length];
  const next = FEATURE_PAGES[(index + 1) % FEATURE_PAGES.length];

  return (
    <main className={`site flex min-h-screen flex-col bg-white! ${outfit.className}`}>
      <SiteHeader />

      {/* the problem, and the answer */}
      <section className="mx-auto w-full max-w-7xl px-6 pt-12 pb-20 lg:px-10 lg:pt-16 lg:pb-28">
        <nav aria-label="Breadcrumb" className="text-sm text-(--quiet)">
          <Link href="/#in-action" className="transition hover:text-(--ink)">
            Features
          </Link>
          <span aria-hidden className="mx-2 text-(--hair)">
            /
          </span>
          <span className="font-medium text-(--leaf-deep)">{feature.name}</span>
        </nav>

        <h1 className="mt-6 max-w-[15ch] text-[clamp(2.5rem,5.6vw,4.6rem)] leading-[1.02] font-bold tracking-[-0.045em] text-balance text-(--ink)">
          {feature.question[0]} <span className="text-[#a9a593]">{feature.question[1]}</span>
        </h1>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="max-w-[34ch] text-[clamp(1.2rem,1.8vw,1.45rem)] leading-relaxed text-(--ink)">
              {feature.answer}{" "}
              <b className="bg-[linear-gradient(transparent_62%,var(--marker)_62%,var(--marker)_90%,transparent_90%)] font-semibold">{feature.emphasis}</b>
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/signup" className="rounded-full bg-(--ink) px-7 py-3.5 text-[15px] font-medium text-white transition hover:bg-(--moss)">
                Create your page
              </Link>
              <Link href="/#in-action" className="text-[15px] font-medium underline decoration-(--hair) decoration-2 underline-offset-[6px] transition hover:decoration-(--leaf)">
                See all features
              </Link>
            </div>
          </div>

          {/* the usual way, crossed out, then the feature itself */}
          <div className="grid gap-6">
            <div>
              <p className="text-[12.5px] font-semibold tracking-[0.08em] text-(--quiet) uppercase">The usual way</p>
              <ul className="mt-3 flex flex-col gap-2">
                {feature.before.map((line, i) => (
                  <li
                    key={line}
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] text-(--quiet) line-through decoration-(--ink)/25 opacity-60 ${
                      i % 2 === 0 ? "self-start rounded-bl-md bg-[#f3f1ea]" : "self-end rounded-br-md bg-(--sage)"
                    }`}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[12.5px] font-semibold tracking-[0.08em] text-(--leaf-deep) uppercase">With {siteConfig.name}</p>
              <div className="mt-3 flex justify-center">
                <FeatureVisual slug={feature.slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* what people ask */}
      <section className="border-y border-(--hair) bg-[#faf8f1]">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
          <h2 className="text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.05] font-bold tracking-[-0.04em] text-(--ink)">What people ask</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {feature.faqs.map((faq) => (
              <li key={faq.q} className="rounded-3xl bg-white p-7 ring-1 ring-(--hair)">
                <h3 className="text-[18px] leading-snug font-semibold tracking-[-0.015em] text-(--ink)">{faq.q}</h3>
                <p className="mt-2.5 text-[15.5px] leading-relaxed text-(--quiet)">{faq.a}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The Sessions page also shows the whole booking loop, from adding times to a booked session. */}
      {feature.slug === "sessions" && <Bookings />}

      {/* the next problem: previous and next features */}
      <nav aria-label="More features" className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-16 sm:grid-cols-2 lg:px-10">
        {[
          { f: previous, label: "← Previous" },
          { f: next, label: "Next →" },
        ].map(({ f, label }, i) => (
          <Link
            key={f.slug}
            href={`/features/${f.slug}`}
            className={`group rounded-3xl p-7 ring-1 ring-(--hair) transition hover:ring-(--sage-edge) hover:shadow-[0_24px_48px_-32px_rgba(31,38,23,0.4)] ${i === 1 ? "sm:text-right" : ""}`}
          >
            <span className="text-[13.5px] text-(--quiet)">{label}</span>
            <span className="mt-1.5 block text-[22px] font-bold tracking-[-0.025em] text-(--ink)">{f.name}</span>
            <span className="mt-1 block text-[15px] text-(--quiet)">
              {f.question[0]} {f.question[1]}
            </span>
          </Link>
        ))}
      </nav>

      <FinalCta />
      <SiteFooter />
    </main>
  );
}
