// Exports the D1 database to a timestamped SQL file under backups/ (git-ignored —
// a dump contains real practitioner and client PII).
//
//   npm run db:backup:local
//   npm run db:backup:remote
//
// There's no automatic schedule for this — D1 has no point-in-time restore built in,
// so run the remote one periodically yourself (e.g. weekly), or wire it into a
// scheduler once this repo has a CI host to run it from.
import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { remote: { type: "boolean", default: false } } });

const target = values.remote ? "--remote" : "--local";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = "backups";
const outputFile = `${outputDir}/mentifylabs-db-${values.remote ? "remote" : "local"}-${stamp}.sql`;

mkdirSync(outputDir, { recursive: true });

console.log(`Exporting mentifylabs-db (${target.slice(2)}) to ${outputFile} ...`);
const result = spawnSync(`npx wrangler d1 export mentifylabs-db ${target} --output "${outputFile}"`, {
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  console.error("Backup failed.");
  process.exit(result.status ?? 1);
}
console.log(`Done: ${outputFile}`);
