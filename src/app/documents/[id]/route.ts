import { first } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { uploads } from "@/lib/storage";
import { getDocumentFile } from "@/data/documents";

/** A verification document, for Super Admin or the practitioner who uploaded it. Never public. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response("Sign in to view this document.", { status: 401 });

  const doc = await getDocumentFile((await params).id);
  if (!doc) return new Response("Not found", { status: 404 });

  if (user.role !== "admin") {
    const owner = await first(
      "SELECT 1 FROM practitioners WHERE id = ? AND slug = ?",
      user.practitionerId,
      doc.practitionerSlug,
    );
    if (!owner) return new Response("Not found", { status: 404 });
  }

  const object = await (await uploads()).get(doc.storageKey);
  if (!object) return new Response("The file is missing from storage.", { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  const filename = doc.name.replace(/["\\\r\n]/g, "_");
  return new Response(object.body, {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Only the admin viewer on this site may frame the file. Images also get a sandbox; Chrome's
      // PDF viewer refuses to render inside one, so PDFs rely on the browser's own isolation.
      "Content-Security-Policy":
        doc.contentType === "application/pdf"
          ? "frame-ancestors 'self'"
          : "default-src 'none'; img-src 'self'; frame-ancestors 'self'; sandbox",
    },
  });
}
