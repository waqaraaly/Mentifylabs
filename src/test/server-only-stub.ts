// Vitest doesn't understand the "react-server" export condition that makes
// bundlers resolve `server-only` to a no-op. Outside that condition it
// resolves to a module that unconditionally throws — this stub replaces it
// for tests (see the alias in vitest.config.ts).
export {};
