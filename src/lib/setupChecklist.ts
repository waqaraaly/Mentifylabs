import type { Practitioner } from "@/types/practitioner";
import { hasFeeRange } from "@/lib/fees";
import { bioOf } from "@/lib/profileDisplay";
import { isVerificationRejected } from "@/lib/verification";

export interface ChecklistItem {
  id: "verify" | "hours" | "photo" | "about" | "areas" | "services" | "background" | "fee" | "publish";
  label: string;
  /** A few words under the label: why it matters, or where it stands. */
  hint: string;
  /** Where it is done in the portal. */
  href: string;
  done: boolean;
}

type ChecklistPractitioner = Pick<
  Practitioner,
  "photoUrl" | "bio" | "specializations" | "services" | "education" | "workExperience" | "feeRange" | "verificationStatus" | "verificationNote" | "profileStatus"
>;

/**
 * What is left before a profile is ready for clients. Setup only asks for the essentials, and this is the rest, in the
 * order that matters for going live: credentials and weekly hours decide whether anyone can book, the others make the
 * page worth opening. Every item points at the place in the portal where it is done, so there is one editor for each
 * thing, not a second copy of it.
 */
export function setupChecklist(p: ChecklistPractitioner, weeklyHourRules: number): { items: ChecklistItem[]; done: number; total: number } {
  const verified = p.verificationStatus === "verified";
  const submitted = verified || p.verificationStatus === "pending";

  const items: ChecklistItem[] = [
    {
      id: "verify",
      label: "Verify your credentials",
      hint: verified ? "Verified" : p.verificationStatus === "pending" ? "Under review" : isVerificationRejected(p) ? "Needs changes" : "Needed before you can go live",
      href: "/dashboard/verification",
      done: submitted,
    },
    {
      id: "hours",
      label: "Set your weekly hours",
      hint: "So clients have times to book",
      href: "/dashboard/slots?view=pattern",
      done: weeklyHourRules > 0,
    },
    { id: "photo", label: "Add a profile photo", hint: "Clients see it first", href: "/dashboard/profile", done: !!p.photoUrl },
    { id: "about", label: "Write your About me", hint: "The main text on your profile", href: "/dashboard/profile", done: !!bioOf(p) },
    { id: "areas", label: "List your areas of expertise", hint: "What you help with", href: "/dashboard/profile", done: p.specializations.length > 0 },
    { id: "services", label: "Add the services you offer", hint: "For example individual therapy", href: "/dashboard/profile", done: p.services.length > 0 },
    {
      id: "background",
      label: "Add your education and experience",
      hint: "Shown as a timeline",
      href: "/dashboard/profile",
      done: p.education.length > 0 || (p.workExperience ?? []).length > 0,
    },
    { id: "fee", label: "Set your fee range", hint: "Per session", href: "/dashboard/profile", done: hasFeeRange(p.feeRange) },
    {
      id: "publish",
      label: "Publish your profile",
      hint: verified ? "Make it visible to clients" : "After your credentials are verified",
      href: "/dashboard/profile",
      done: p.profileStatus === "published",
    },
  ];

  return { items, done: items.filter((i) => i.done).length, total: items.length };
}
