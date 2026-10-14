import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { AvailabilityControls } from "@/components/site/AvailabilityControls";
import { Faq } from "@/components/site/Faq";
import { FAQ_ITEMS } from "@/components/site/faqItems";
import { FeatureTour } from "@/components/site/FeatureTour";
import { FinalCta } from "@/components/site/FinalCta";
import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { HeroBooking } from "@/components/site/HeroBooking";
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
        <section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-[minmax(0,1fr)] items-center gap-12 px-6 pt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:px-10 lg:pt-12">
          <div className="pb-4 lg:pb-16">
            <h1 className="text-[clamp(3rem,6.6vw,6rem)] leading-[0.92] font-semibold tracking-[-0.06em] text-(--ink)">
              Be seen.
              <br />
              <span className="text-[#b9b5aa]">Be trusted.</span>
              <br />
              <span className="text-(--leaf-deep)">Be booked.</span>
            </h1>
            <p className="mt-6 max-w-[36ch] text-xl leading-relaxed text-(--quiet)">A calm, verified page for your practice, with your real open times and one link to share.</p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/signup" className="rounded-full bg-(--ink) px-7 py-3.5 text-base font-medium text-white transition hover:bg-(--moss)">
                Create your page
              </Link>
              <Link href="/login" className="text-base font-medium underline decoration-[#d3cec3] decoration-2 underline-offset-[6px] transition hover:decoration-(--ink)">
                I already have an account
              </Link>
            </div>
          </div>

          {/* The booking, live: a client requests a time and the practitioner accepts it. */}
          <HeroBooking />
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
