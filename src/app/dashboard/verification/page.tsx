import { BadgeCheck, Clock, Download, ExternalLink, FileText, ShieldCheck, TriangleAlert, UploadCloud } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getDocumentsByPractitioner } from "@/data/documents";
import { PageHeader } from "@/components/ui/PageHeader";
import { VerificationBadge } from "@/components/portal/VerificationBadge";
import { SettingsCard } from "@/components/portal/SettingsCard";
import { formatFileSize } from "@/lib/format";
import { isVerificationRejected } from "@/lib/verification";
import { VerificationUploadForm } from "@/components/portal/VerificationUploadForm";

export const metadata = { title: "Verification" };

export default async function VerificationPage() {
  const practitioner = await getCurrentPractitioner();
  const documents = await getDocumentsByPractitioner(practitioner.slug);
  const rejected = isVerificationRejected(practitioner);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-2 pb-12 sm:px-4">
      <PageHeader
        icon={BadgeCheck}
        title="Verification"
        description="Confirm your credentials to get the verified badge clients see on your public profile."
      />

      <SettingsCard
        icon={<BadgeCheck className="size-[18px]" aria-hidden />}
        title="Verification status"
        aside={<VerificationBadge status={practitioner.verificationStatus} rejected={rejected} />}
      >
        {practitioner.verificationStatus === "verified" ? (
          <div className="flex items-start gap-3 px-6 py-6">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <div>
              <p className="font-medium text-success">Verified</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Approved {practitioner.verifiedOn ?? ""}. The verified badge now shows on your public profile.
              </p>
            </div>
          </div>
        ) : practitioner.verificationStatus === "pending" ? (
          <div className="flex items-start gap-3 px-6 py-6">
            <Clock className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            <div>
              <p className="font-medium">Under review</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                The MentifyLabs team is checking what you submitted. You&apos;ll see the verified badge on your public
                profile as soon as it&apos;s approved. No action is needed for now.
              </p>
            </div>
          </div>
        ) : rejected ? (
          <div className="flex items-start gap-3 px-6 py-6">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-accent-strong" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Changes needed</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                We couldn&apos;t verify this yet. See the reason below, then upload a new document to submit again.
              </p>
              <div className="mt-3 rounded-lg bg-black/[0.04] px-4 py-3">
                <p className="text-xs font-medium tracking-[0.08em] text-muted uppercase">From the team</p>
                <p className="mt-1 text-sm leading-relaxed">{practitioner.verificationNote}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-6 py-6">
            <Clock className="mt-0.5 size-5 shrink-0 text-accent-strong" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Verification needed</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Choose how you can verify yourself below, such as your license or degree, and add a document for each, so
                the MentifyLabs team can confirm who you are. Your public profile can&apos;t go live and you can&apos;t
                accept bookings until your credentials are approved and you publish it.
              </p>
            </div>
          </div>
        )}
      </SettingsCard>

      {practitioner.verificationStatus === "unverified" && (
        <SettingsCard icon={<UploadCloud className="size-[18px]" aria-hidden />} title={rejected ? "Submit again" : "Verify yourself"}>
          <VerificationUploadForm slug={practitioner.slug} />
        </SettingsCard>
      )}

      {documents.length > 0 && (practitioner.verificationStatus !== "unverified" || rejected) && (
        <SettingsCard icon={<FileText className="size-[18px]" aria-hidden />} title={rejected ? "Previously submitted" : "Submitted documents"}>
          <ul className="divide-y divide-black/[0.06]">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-6 py-4">
                <FileText className="size-4 shrink-0 text-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{d.category}</p>
                  <p className="truncate text-sm text-muted">
                    {d.name}
                    {d.sizeBytes ? ` · ${formatFileSize(d.sizeBytes)}` : ""}
                  </p>
                </div>
                {d.hasFile && (
                  <div className="flex shrink-0 items-center">
                    <a
                      href={`/documents/${d.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="View"
                      className="flex size-11 items-center justify-center rounded-lg text-muted transition hover:bg-black/[0.05] hover:text-foreground"
                    >
                      <ExternalLink className="size-4" aria-hidden />
                      <span className="sr-only">View {d.category}: {d.name}</span>
                    </a>
                    <a
                      href={`/documents/${d.id}?download=1`}
                      title="Download"
                      className="flex size-11 items-center justify-center rounded-lg text-muted transition hover:bg-black/[0.05] hover:text-foreground"
                    >
                      <Download className="size-4" aria-hidden />
                      <span className="sr-only">Download {d.category}: {d.name}</span>
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </SettingsCard>
      )}
    </div>
  );
}
