import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

const LAST_UPDATED = "September 29, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
        <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">{siteConfig.name}</p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.15]">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

        <p className="mt-8 text-[15px] leading-relaxed text-muted">
          These terms govern your use of {siteConfig.name} (the &ldquo;Platform&rdquo;). By
          creating an account or booking an appointment through the Platform, you agree to them.
          If you don&rsquo;t agree, please don&rsquo;t use the Platform.
        </p>

        <Section title="1. What the Platform is">
          <p>
            {siteConfig.name} lets independent therapists and mental health practitioners
            (&ldquo;Practitioners&rdquo;) create a public profile and manage appointment bookings,
            and lets visitors (&ldquo;Clients&rdquo;) find and request appointments with them.
          </p>
          <p>
            We are not a healthcare provider, and we do not supervise, employ, or take
            responsibility for the clinical services a Practitioner provides. Every Practitioner
            is solely responsible for their own qualifications, conduct, and the care they give.
          </p>
        </Section>

        <Section title="2. Practitioner accounts and verification">
          <p>
            When you sign up as a Practitioner, your account and profile start in draft and are
            reviewed by our team before your profile is published and visible to Clients.
          </p>
          <p>
            You&rsquo;re responsible for the accuracy of the information on your profile,
            including your credentials, and for promptly correcting anything that changes.
          </p>
        </Section>

        <Section title="3. Bookings">
          <p>
            A booking request made through the Platform is an agreement between the Client and
            the Practitioner directly. We facilitate the introduction and scheduling — we are not
            a party to, and don&rsquo;t guarantee, the appointment itself, its outcome, or any
            refund or cancellation arrangement, which is between Client and Practitioner unless a
            Practitioner&rsquo;s own stated policy says otherwise.
          </p>
        </Section>

        <Section title="4. Acceptable use">
          <p>You agree not to: impersonate another person or organization; submit false credentials or profile information; use the Platform to harass, abuse, or harm another user; or attempt to disrupt or gain unauthorized access to the Platform or its data.</p>
          <p>We may suspend or terminate an account that violates these terms, engages in fraud, or where we&rsquo;re required to for legal or safety reasons.</p>
        </Section>

        <Section title="5. Content you submit">
          <p>
            You retain ownership of the content you submit (profile text, photos, documents). By
            submitting it, you give us the right to display it on the Platform as needed to
            operate the service (e.g. showing your public profile to visitors).
          </p>
        </Section>

        <Section title="6. Disclaimers">
          <p>
            The Platform is provided &ldquo;as is.&rdquo; We don&rsquo;t guarantee it will be
            uninterrupted, error-free, or that any Practitioner listed is suitable for your needs.
            If you are in crisis or need emergency care, please contact emergency services
            directly rather than relying on the Platform.
          </p>
        </Section>

        <Section title="7. Limitation of liability">
          <p>
            To the fullest extent permitted by law, {siteConfig.name} is not liable for any
            indirect, incidental, or consequential damages arising from your use of the Platform,
            or from the conduct of any Practitioner or Client using it.
          </p>
        </Section>

        <Section title="8. Changes to these terms">
          <p>
            We may update these terms from time to time. We&rsquo;ll update the &ldquo;Last
            updated&rdquo; date above, and for material changes we&rsquo;ll make a reasonable
            effort to notify Practitioners directly.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Questions about these terms can be sent to{" "}
            <a href="mailto:hello@mentifylabs.com" className="text-primary underline">
              hello@mentifylabs.com
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}
