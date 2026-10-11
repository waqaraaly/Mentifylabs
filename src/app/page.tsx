import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Faq, FAQ_ITEMS } from "@/components/site/Faq";
import { Features } from "@/components/site/Features";
import { FinalCta } from "@/components/site/FinalCta";
import { HeroVideo } from "@/components/site/HeroVideo";
import { HowItWorks } from "@/components/site/HowItWorks";
import { ShareAnywhere } from "@/components/site/ShareAnywhere";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { WhoItsFor } from "@/components/site/WhoItsFor";
import { siteConfig } from "@/lib/site";

// Inter for everything, headings and body alike.
const inter = Inter({ subsets: ["latin"] });

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

/** A small coloured shape set between the words of the headline. Decorative. */
function Pill({ className }: { className: string }) {
  return <span aria-hidden className={`relative -top-[0.04em] mx-[0.06em] inline-block h-[0.78em] rounded-full align-middle ${className}`} />;
}

export default function Home() {
  return (
    <main className={`site flex min-h-screen flex-col bg-white! ${inter.className}`}>
      <SiteHeader />

      <div className="relative isolate flex flex-1 flex-col overflow-hidden">
        {/* The sage panel behind the video, with a honey circle at its edge. Decorative. */}
        <div aria-hidden className="absolute inset-x-0 top-[44%] bottom-0 -z-10 rounded-t-[120px] bg-linear-to-b from-(--sage) to-[#dfe7cb] lg:inset-x-auto lg:top-0 lg:right-0 lg:w-[46%] lg:rounded-t-none lg:rounded-l-[220px]" />
        <div aria-hidden className="absolute top-[38%] right-6 -z-10 size-12 rounded-full bg-(--glow)/75 lg:top-auto lg:right-[36%] lg:bottom-9 lg:size-[74px]" />
        <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
          <div>
            <h1 className="text-[clamp(2.2rem,4.7vw,3.9rem)] leading-[1.12] font-semibold tracking-[-0.04em] text-balance text-(--ink)">
              Build your <Pill className="w-[1.7em] bg-(--sage) ring-2 ring-(--sage-edge) ring-inset" /> practice page,{" "}
              <Pill className="w-[1.2em] bg-(--glow)" /> share your open times <Pill className="w-[1.9em] bg-(--leaf)" /> and get found.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-(--quiet)">One calm page for your name, your work and your availability.</p>

            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/signup" className="rounded-full bg-(--ink) px-7 py-3.5 text-[15px] font-medium text-white transition hover:bg-(--moss)">
                Create your page
              </Link>
              <Link href="/login" className="text-[15px] font-medium underline decoration-(--hair) decoration-2 underline-offset-[6px] transition hover:decoration-(--leaf)">
                I already have an account
              </Link>
            </div>
          </div>

          {/* The product showreel, in a browser window. The file is public/video/homepage-hero.mp4. */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_-24px_rgba(31,38,23,0.35)] ring-1 ring-(--hair)">
              <div className="flex items-center gap-1.5 border-b border-(--hair) bg-[#f6f7f1] px-3.5 py-2.5">
                <span aria-hidden className="size-2.5 rounded-full bg-(--hair)" />
                <span aria-hidden className="size-2.5 rounded-full bg-(--hair)" />
                <span aria-hidden className="size-2.5 rounded-full bg-(--hair)" />
                <span className="ml-2.5 max-w-60 flex-1 truncate rounded-full bg-white px-3 py-0.5 text-[11px] text-(--quiet) ring-1 ring-(--hair)">
                  mentifylabs.com/your-name
                </span>
              </div>
              <HeroVideo />
            </div>
          </div>
        </section>
      </div>

      <WhoItsFor />
      <Features />
      <ShareAnywhere />
      <HowItWorks />
      <Faq />
      <FinalCta />
      <SiteFooter />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
    </main>
  );
}
