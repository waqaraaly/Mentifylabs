import path from "node:path";
import { defineConfig } from "vitest/config";

const rootDir = import.meta.dirname;

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // Booting the local D1 binding via wrangler is slow the first time.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // D1 writes are serialized against one local SQLite file — running
    // suites in parallel processes risks lock contention, so keep it simple.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "server-only": path.resolve(rootDir, "src/test/server-only-stub.ts"),
      "@": path.resolve(rootDir, "src"),
    },
  },
});
