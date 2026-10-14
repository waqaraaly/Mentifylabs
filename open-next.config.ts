import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

// Pre-rendered public profiles are cached in R2 (KV's free plan stops at 1,000 writes a day; R2 allows about a million a month). When a practitioner or admin saves a change,
// revalidatePath() writes to the D1 tag cache, so the next visitor gets a freshly rendered page.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: memoryQueue,
});
