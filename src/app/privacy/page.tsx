import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

const LAST_UPDATED = "September 29, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
        <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">{siteConfig.name}</p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.15]">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

        <p className="mt-8 text-[15px] leading-relaxed text-muted">
          {siteConfig.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a platform that helps
          people find and book appointments with independent therapists and mental health
          practitioners (&ldquo;Practitioners&rdquo;). This policy explains what personal data we
          collect from Practitioners and from people booking appointments (&ldquo;Clients&rdquo;),
          why we collect it, and how it&rsquo;s handled.
        </p>

        <Section title="1. Information we collect">
          <p><strong className="text-foreground">From Practitioners:</strong> full name, professional title, email, phone, profile photo, bio, qualifications, and — where you choose to submit it — a verification document (e.g. a license or certificate) used only to confirm your credentials.</p>
          <p><strong className="text-foreground">From Clients:</strong> the name, email, and phone number you give us when requesting or booking an appointment, and any notes you choose to include with a booking request.</p>
          <p><strong className="text-foreground">Automatically:</strong> basic technical data (IP address, browser type, pages visited) used for security, fraud prevention, and keeping the service working — we do not use third-party advertising trackers.</p>
        </Section>

        <Section title="2. How we use it">
          <p>To operate the booking platform: creating and displaying Practitioner profiles, matching Clients with Practitioners, and sending booking confirmations, reminders, and account emails.</p>
          <p>To verify Practitioner credentials and review profiles for quality and safety before they&rsquo;re published.</p>
          <p>To secure accounts (login, password reset) and prevent abuse (e.g. rate-limiting sign-ups).</p>
          <p>We do not sell personal data, and we do not share it with third parties for their own marketing purposes.</p>
        </Section>

        <Section title="3. What we don't collect">
          <p>
            We are a booking and profile platform, not a record-keeping system for therapy
            sessions. We do not collect clinical notes, diagnoses, or session content — whatever a
            Client and Practitioner discuss during a session stays between them.
          </p>
        </Section>

        <Section title="4. Who can see what">
          <p>A Practitioner&rsquo;s public profile (name, title, bio, specializations, contact details marked public) is visible to anyone who visits their page.</p>
          <p>Booking requests, private contact details, and verification documents are visible only to the Practitioner they belong to and to our Super Admin team — never published publicly.</p>
        </Section>

        <Section title="5. Where data is stored">
          <p>
            Data is stored on Cloudflare&rsquo;s infrastructure (database and file storage).
            Transactional emails (booking confirmations, password resets) are sent through Resend,
            our email delivery provider, which processes the minimum data needed to deliver those
            emails.
          </p>
        </Section>

        <Section title="6. Data retention">
          <p>
            We keep account and booking data for as long as your account is active, plus a
            reasonable period afterward for legal, security, and record-keeping purposes. You can
            request deletion of your account and associated data at any time (see Section 8).
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            We use a single session cookie to keep you signed in. It&rsquo;s necessary for the site
            to function and isn&rsquo;t used for advertising or cross-site tracking.
          </p>
        </Section>

        <Section title="8. Your rights">
          <p>
            You can ask us to access, correct, or delete the personal data we hold about you, or
            to export it, by emailing{" "}
            <a href="mailto:privacy@mentifylabs.com" className="text-primary underline">
              privacy@mentifylabs.com
            </a>
            . We&rsquo;ll respond within a reasonable time.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            We may update this policy as the platform changes. We&rsquo;ll update the &ldquo;Last
            updated&rdquo; date above, and for material changes we&rsquo;ll make a reasonable
            effort to notify Practitioners directly.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about this policy or your data can be sent to{" "}
            <a href="mailto:privacy@mentifylabs.com" className="text-primary underline">
              privacy@mentifylabs.com
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}
