import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SuggestionForm } from "@/components/portal/SuggestionForm";

export const metadata = { title: "Help us improve" };

export default function SuggestionsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-2 pb-12 sm:px-4">
      <PageHeader
        icon={Lightbulb}
        title="Help us improve the platform"
        description="Tell us what would make MentifyLabs better for you. There are no right answers, and it takes a minute."
      />
      <SuggestionForm />
    </div>
  );
}
