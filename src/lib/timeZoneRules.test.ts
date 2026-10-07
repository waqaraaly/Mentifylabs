import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Time zones are only right if nothing asks "what time is it on this machine?". The server runs on UTC and a browser on
 * its owner's clock, so such code gives a different answer in each. These folders hold the practitioner portal, the
 * public profile and the data layer, where "now" and "today" must always be worked out for a named zone (`lib/time.ts`).
 */
const FOLDERS = ["src/app/dashboard", "src/app/[username]", "src/app/preview", "src/components/portal", "src/components/practitioner", "src/data"];

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /\.getHours\(/, why: "reads the machine's clock; use wallClockIn(zone)" },
  { pattern: /\.getMinutes\(/, why: "reads the machine's clock; use wallClockIn(zone)" },
  { pattern: /todayIsoDate\(\s*\)/, why: "needs a zone: todayIsoDate(zone)" },
  { pattern: /new Date\(`\$\{[^}]+\}T\$\{[^}]+\}`\)/, why: "builds a moment on the machine's clock; use instantOf(date, time, zone)" },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe("time zone rules", () => {
  it("no portal, public profile or data code reads the machine's own clock", () => {
    const problems: string[] = [];
    for (const folder of FOLDERS) {
      for (const file of sourceFiles(folder)) {
        const lines = readFileSync(file, "utf8").split("\n");
        lines.forEach((line, i) => {
          if (/^\s*(\/\/|\/\*|\*)/.test(line)) return; // comments may talk about it
          for (const { pattern, why } of FORBIDDEN) {
            if (pattern.test(line)) problems.push(`${file}:${i + 1}  ${why}\n    ${line.trim()}`);
          }
        });
      }
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
});
