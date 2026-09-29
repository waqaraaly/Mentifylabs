import Link from "next/link";

export default function PractitionerNotFound() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 lg:px-10">
        <h1 className="font-serif text-3xl">Practitioner not found</h1>
        <p className="mt-2 text-muted">
          This profile doesn&apos;t exist or is no longer available.
        </p>
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
