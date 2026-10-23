import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { AvailabilityControls } from "@/components/site/AvailabilityControls";
import { Faq } from "@/components/site/Faq";
import { FAQ_ITEMS } from "@/components/site/faqItems";
import { FeatureTour } from "@/components/site/FeatureTour";
import { FinalCta } from "@/components/site/FinalCta";
import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { HeroClaim } from "@/components/site/HeroClaim";
import { HeroStory } from "@/components/site/HeroStory";
import { HowItWorks } from "@/components/site/HowItWorks";
import { ProfileThemes } from "@/components/site/ProfileThemes";
import { ShareLink } from "@/components/site/ShareLink";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { WhoItsFor } from "@/components/site/WhoItsFor";
import { siteConfig } from "@/lib/site";

// Outfit for everything on the homepage, headings and body alike.
const outfit = Outfit({ subsets: ["latin"] });

const title = `${siteConfig.name}: your practice, on one page`;
const description =
  "A simple page for your practice: your name, your work and your real open times. Verified profiles, private requests, and nothing for clients to sign up for.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: siteConfig.name, title, description },
  twitter: { card: "summary", title, description },
};

// Search-engine markup for the visible questions. Built only from the constants in Faq.tsx.
const faqJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
}).replace(/</g, "\\u003c");

export default function Home() {
  return (
    <main className={`site flex min-h-screen flex-col bg-white! ${outfit.className}`}>
      <SiteHeader />

      <div className="relative isolate flex flex-1 flex-col overflow-hidden bg-[#fbfaf7]">
        <HeroBackdrop />
        <section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-[minmax(0,1fr)] items-center gap-12 px-6 pt-10 pb-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-14 lg:px-10 lg:pt-12">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#e4e1d3] bg-white/70 px-4 py-1.5 text-sm font-medium text-(--quiet)">
              For therapists, psychologists and counsellors
            </span>
            <h1 className="isolate mt-5 text-[clamp(2.7rem,5.6vw,4.9rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance text-(--ink)">
              Your practice, on{" "}
              <span className="relative whitespace-nowrap text-(--leaf-deep)">
                one page
                <span aria-hidden className="absolute inset-x-0 bottom-[0.02em] -z-10 h-[0.16em] rounded bg-[#f0c05a]/55" />
              </span>{" "}
              clients can book.
            </h1>
            <p className="mt-5 max-w-[34em] text-[1.28rem] leading-normal text-(--quiet)">
              Put your credentials and your real open times in one verified profile. Share a single link, and clients request a session in seconds, with no account to create.
            </p>

            <div className="mt-8">
              <HeroClaim />
            </div>
            <Link href="/login" className="mt-4 inline-block text-[15px] font-medium underline decoration-[#d3cec3] decoration-2 underline-offset-[6px] transition hover:decoration-(--ink)">
              I already have an account
            </Link>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-[15px] font-medium">
              {["Verified credentials", "Real open times", "Private requests"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 text-(--leaf-deep)" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 12.5 4.5 4.5L19 7" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* The whole story in one loop: a client requests a time and the practitioner accepts it. */}
          <HeroStory />
        </section>
      </div>

      <WhoItsFor />
      <ShareLink />
      <ProfileThemes />
      <AvailabilityControls />
      <HowItWorks />
      <FeatureTour />
      <Faq />
      <FinalCta />
      <SiteFooter />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
    </main>
  );
}
