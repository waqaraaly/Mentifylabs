import { BadgeCheck, Clock, FileText, ShieldCheck, UploadCloud, XCircle } from "lucide-react";
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
                profile as soon as it&apos;s approved — no action needed for now.
              </p>
            </div>
          </div>
        ) : rejected ? (
          <div className="flex items-start gap-3 px-6 py-6">
            <XCircle className="mt-0.5 size-5 shrink-0 text-alert" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-alert">Not approved</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                The MentifyLabs team couldn&apos;t approve what you submitted. Review the reason below, then upload a new
                document to submit again.
              </p>
              <p className="mt-3 rounded-lg bg-alert/[0.08] px-3.5 py-2.5 text-sm font-medium text-alert">
                <strong>Reason:</strong> {practitioner.verificationNote}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-6 py-6">
            <Clock className="mt-0.5 size-5 shrink-0 text-accent-strong" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Verification needed</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Upload one credential below — your degree, a professional license, or another certification — so the
                MentifyLabs team can confirm who you are. Your public profile can&apos;t go live and you can&apos;t
                accept bookings until your credentials are approved and you publish it.
              </p>
            </div>
          </div>
        )}
      </SettingsCard>

      {practitioner.verificationStatus === "unverified" && (
        <SettingsCard icon={<UploadCloud className="size-[18px]" aria-hidden />} title={rejected ? "Submit again" : "Upload a credential"}>
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
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted">
                    {d.category}
                    {d.sizeBytes ? ` · ${formatFileSize(d.sizeBytes)}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SettingsCard>
      )}
    </div>
  );
}
