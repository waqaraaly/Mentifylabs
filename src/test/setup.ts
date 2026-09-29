// Makes `getCloudflareContext({ async: true })` take the "we're in a Node.js
// process" branch, so it asks wrangler for a real D1 binding backed by the
// same local SQLite file `next dev` uses (see @opennextjs/cloudflare's
// cloudflare-context.js). No Next.js server needs to be running.
process.env.NEXT_RUNTIME = "nodejs";
