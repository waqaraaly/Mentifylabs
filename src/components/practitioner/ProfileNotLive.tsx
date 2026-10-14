import Link from "next/link";

/**
 * What a visitor sees on a profile link that has been claimed but isn't live yet. It says nothing about the person: no
 * name, photo or details, only that the link is reserved. It is for clients, so it carries nothing aimed at the practitioner.
 */
export function ProfileNotLive() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 lg:px-10">
        <h1 className="font-serif text-3xl">This profile isn&apos;t live yet</h1>
        <p className="mt-2 text-muted">Check back soon.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
