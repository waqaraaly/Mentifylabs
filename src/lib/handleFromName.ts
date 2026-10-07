/**
 * The link a name would make: "Dr. Ayesha Khan" -> "dr-ayesha-khan". Letters and numbers only, joined by single hyphens,
 * at most 30 characters, which is the shape the profile link step expects. It is a suggestion; whether the link is free
 * is checked when the person sets up.
 */
export function handleFromName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // drop accents, so "Zoë" becomes "zoe"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/, "");
}
