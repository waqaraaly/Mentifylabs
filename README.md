# MentifyLabs

Therapist profiles and booking: public practitioner pages (`/[username]`), the practitioner portal (`/dashboard`) and Super Admin (`/admin`). Next.js 16 on Cloudflare Workers (via OpenNext) with Cloudflare D1 for data.

## Local development

```bash
npm install
npm run db:migrate:local   # create the tables in a local D1 database (.wrangler/)
npm run db:seed:local      # load the demo data
npm run dev                # http://localhost:3000
```

`next dev` gets the same `DB` binding as production through `initOpenNextCloudflareForDev()` in `next.config.ts`, backed by a local SQLite file. To run the real Worker build locally: `npm run preview`.

## Accounts and sign-in

Practitioners create their own account at `/signup` (pending approval, draft profile). They can't sign in until they confirm their email: sign-up sends a link, and pressing "Confirm my email" on it confirms the address and signs them in (the button, not the page load, so mail scanners can't use the link up). Sign in afterwards at `/login`; an unconfirmed account is refused with an offer to resend the link. Changing the email in Settings waits as a pending address until the new one is confirmed. Accounts made by an admin, or from the command line, count as confirmed once a password is set from the emailed link (or immediately, for the command line). Migration `0014` treats every account that existed before it as already confirmed. `/forgot-password` emails a one-time link (60 minutes) to `/reset-password`. In Super Admin, "Send reset link" makes a 7-day link, emails it if possible and always copies it to the admin's clipboard; for practitioners added by an admin it also creates their sign-in account, so it doubles as an invite. Suspended or rejected practitioners can't sign in, and their open sessions stop working.

Admins, and accounts for existing practitioners, can also be created or reset from the command line:

```bash
npm run user:create -- --email admin@example.com --role admin [--remote]
npm run user:create -- --email someone@example.com --role practitioner --practitioner <slug> [--remote]
```

Without `--remote` it writes to the local database; with it, to production. A strong password is generated and saved to `credentials.local.txt` (git-ignored), never printed. Running it again for the same email resets the password and signs out that account's sessions.

Passwords are PBKDF2-hashed (`src/lib/password.ts`). Sessions are HttpOnly cookies whose SHA-256 is stored in D1 (`src/lib/session.ts`). Ten failed sign-ins lock an email for 15 minutes. Every admin page and action calls `requireAdmin()`; every dashboard action checks the slug and records it touches belong to the signed-in practitioner (`requireOwnSlug`).

## Email

Emails (reset links, new sign-up alerts) go through [Resend](https://resend.com) when the Worker has a `RESEND_API_KEY` secret:

```bash
npx wrangler secret put RESEND_API_KEY
```

Without it, emails are written to the server log instead. `mentifylabs.com` is verified in Resend and `MAIL_FROM` in `wrangler.jsonc` sends from `no-reply@mentifylabs.com` on it, so real practitioners actually receive these.

## Uploads

Files live in the R2 bucket `mentifylabs-uploads` (binding `UPLOADS`).

- Profile photos are cropped to a square JPEG in the browser, stored under `photos/`, and served publicly from `/media/...` with long-term caching.
- Verification documents (PDF, JPG, PNG or WebP, up to 10 MB) are uploaded from the practitioner's Settings page, stored under `documents/`, and served from `/documents/<id>` only to Super Admin and the practitioner who uploaded them.

## Caching

Pre-rendered public profiles are cached in KV (`NEXT_INC_CACHE_KV`). `revalidatePath()` records changes in the `mentifylabs-cache` D1 database (`NEXT_TAG_CACHE_D1`), so profile edits show on the live site immediately.

## Deploying to Cloudflare

Production runs at https://mentifylabs.com (Worker name `mentifylabs`, still reachable at
https://mentifylabs.therapy-app.workers.dev too) with the D1 database `mentifylabs-db` (APAC).

1. `npm run db:migrate:remote` after adding a migration.
2. `npm run deploy`

Stop `npm run dev` before building: a production build alongside the dev server locks `.open-next` and can leave the dev server returning 404s (fix with deleting `.next/dev`).

## Monitoring production errors

There's no error-tracking service (Sentry or similar) wired up. To see what's actually happening
in production, stream live logs and exceptions from the Worker:

```bash
npx wrangler tail
```

This shows every request and any thrown error in real time, with stack traces. It only streams
while running — there's no history or alerting, so it's a "watch it happen" tool, not a substitute
for real error tracking. Worth revisiting if/when error volume makes that gap painful.

## Backups

D1 has no automatic point-in-time restore. Run `npm run db:backup:remote` periodically (weekly is
reasonable) to export the production database to a timestamped file under `backups/` (git-ignored —
it contains real PII). There's no scheduler wired up for this yet; run it by hand, or wire it into
whatever CI/cron host this repo ends up on.

## How data flows

Pages and server actions call the async functions in `src/data/`. Those run SQL against D1 through `src/lib/db.ts`, which is server-only. Schema changes go in `migrations/` as new numbered files; after changing `wrangler.jsonc`, run `npm run cf-typegen`.

- Booking, cancelling and rescheduling each run as one D1 batch (a transaction), and a unique index stops two live appointments from holding the same slot.
- Every table references `practitioners(slug)` with `ON UPDATE CASCADE`, so renaming a slug carries all related records with it.
- `/dashboard` and `/admin` call `connection()` so they always render live data.

## Not done yet

- Error tracking (Sentry or similar) — `wrangler tail` is the stopgap for now (see above).
- Legal pages (`/privacy`, `/terms`) exist but haven't had a lawyer's review — get one before
  relying on them.
