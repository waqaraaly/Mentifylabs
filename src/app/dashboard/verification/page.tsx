import { BadgeCheck, Download, ExternalLink, FileText } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getDocumentsByPractitioner } from "@/data/documents";
import { PageHeader } from "@/components/ui/PageHeader";
import { VerificationBadge } from "@/components/portal/VerificationBadge";
import { VerificationUploadForm } from "@/components/portal/VerificationUploadForm";
import { formatFileSize } from "@/lib/format";
import { isVerificationRejected } from "@/lib/verification";

export const metadata = { title: "Verification" };

const card = "rounded-2xl bg-surface ring-1 ring-black/[0.07]";

function approvedOn(date: string | undefined): string | null {
  const d = date ? new Date(`${date}T00:00:00`) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
}

export default async function VerificationPage() {
  const practitioner = await getCurrentPractitioner();
  const documents = await getDocumentsByPractitioner(practitioner.slug);
  const status = practitioner.verificationStatus;
  const rejected = isVerificationRejected(practitioner);
  const approved = approvedOn(practitioner.verifiedOn);

  // The state is said once, here, instead of in a separate status card.
  const description =
    status === "verified"
      ? `${approved ? `Approved on ${approved}. ` : ""}The verified badge shows on your public profile.`
      : status === "pending"
        ? "We're checking your documents and will let you know when there's a decision."
        : rejected
          ? "We couldn't verify your documents. Read the note below, then send new ones."
          : "Send a document that shows your qualifications. You can't publish your profile until it's approved.";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-2 pb-12 sm:px-4">
      <PageHeader
        icon={BadgeCheck}
        title="Verification"
        description={description}
        actions={<VerificationBadge status={status} rejected={rejected} />}
      />

      {rejected && (
        <section className={`${card} px-6 py-5`}>
          <h2 className="text-sm font-semibold">Note from our team</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{practitioner.verificationNote}</p>
        </section>
      )}

      {status === "unverified" && (
        <section className={card}>
          <VerificationUploadForm slug={practitioner.slug} />
        </section>
      )}

      {documents.length > 0 && (status !== "unverified" || rejected) && (
        <section>
          <h2 className="mb-3 text-base font-semibold tracking-tight">{rejected ? "Previously sent" : "Documents sent"}</h2>
          <ul className={`${card} divide-y divide-black/[0.06]`}>
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
        </section>
      )}
    </div>
  );
}
