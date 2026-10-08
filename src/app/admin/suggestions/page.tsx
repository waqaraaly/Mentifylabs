import { requireAdmin } from "@/lib/session";
import { getAllSuggestions } from "@/data/suggestions";
import { SuggestionsView } from "@/components/admin/SuggestionsView";

export const metadata = { title: "Suggestions" };

export default async function AdminSuggestionsPage() {
  await requireAdmin();
  return <SuggestionsView suggestions={await getAllSuggestions()} />;
}
