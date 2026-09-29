import { BadgeCheck } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getDocumentsByPractitioner } from "@/data/documents";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { verificationDaysLeft, VERIFICATION_WINDOW_DAYS } from "@/lib/verification";
import { VerificationUploadForm } from "@/components/portal/VerificationUploadForm";

export const metadata = { title: "Verification" };

export default async function VerificationPage() {
  const practitioner = await getCurrentPractitioner();
  const documents = await getDocumentsByPractitioner(practitioner.slug);
  const daysLeft = verificationDaysLeft(practitioner.dateJoined);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-1 pb-8 sm:px-3">
      <PageHeader
        icon={BadgeCheck}
        title="Verification"
        badge={<StatusBadge status={practitioner.verificationStatus} />}
        description="Confirm your credentials to get the verified badge clients see on your public profile."
      />

      {practitioner.verificationStatus === "verified" ? (
        <div className="flex items-start gap-3.5 rounded-2xl bg-success/[0.08] p-6 ring-1 ring-success/20">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <div>
            <p className="font-semibold text-success">You&apos;re verified</p>
            <p className="mt-1 text-sm text-muted">
              Approved {practitioner.verifiedOn ?? ""}. The verified badge now shows on your public profile.
            </p>
          </div>
        </div>
      ) : practitioner.verificationStatus === "pending" ? (
        <div className="rounded-2xl bg-surface p-6 ring-1 ring-border">
          <p className="font-semibold">Under review</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            The MentifyLabs team is checking what you submitted. You&apos;ll see the verified badge on your public
            profile as soon as it&apos;s approved — no action needed for now.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`rounded-2xl p-6 ring-1 ${
              daysLeft < 0
                ? "bg-alert/[0.08] ring-alert/20"
                : daysLeft <= 14
                  ? "bg-accent/[0.1] ring-accent/25"
                  : "bg-surface ring-border"
            }`}
          >
            <p className="font-semibold">
              {daysLeft >= 0
                ? `${daysLeft} of ${VERIFICATION_WINDOW_DAYS} days left to verify`
                : `${Math.abs(daysLeft)} days past your verification window`}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Upload one credential below — your degree, a professional license, or another certification — so the
              MentifyLabs team can confirm who you are and give you the verified badge.
            </p>
            {practitioner.verificationNote && (
              <p className="mt-3 rounded-lg bg-alert/[0.08] px-3.5 py-2.5 text-sm font-medium text-alert">
                <strong>Feedback from the last review:</strong> {practitioner.verificationNote}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-surface ring-1 ring-border">
            <VerificationUploadForm slug={practitioner.slug} />
          </div>
        </>
      )}

      {documents.length > 0 && practitioner.verificationStatus !== "unverified" && (
        <div className="rounded-2xl bg-surface p-6 ring-1 ring-border">
          <p className="text-sm font-semibold">Submitted documents</p>
          <ul className="mt-3 divide-y divide-black/[0.06]">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate">{d.name}</span>
                <span className="shrink-0 text-xs text-muted">{d.category}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
