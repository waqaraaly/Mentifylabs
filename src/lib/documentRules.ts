/**
 * A short fingerprint of the documents on file. The review page sends the one it showed the admin, and the server
 * compares it with the current one, so a decision can only be made on the documents the admin actually looked at.
 */
export function documentsFingerprint(docs: { id: string }[]): string {
  return docs.map((d) => d.id).sort().join(",");
}
