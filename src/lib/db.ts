import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** The D1 database bound as `DB` in wrangler.jsonc. In `next dev` it's a local SQLite file under .wrangler/. */
export async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

type Param = string | number | null | undefined;

/** D1 rejects `undefined`, so optional values are bound as NULL. */
function bindAll(stmt: D1PreparedStatement, params: Param[]): D1PreparedStatement {
  return params.length ? stmt.bind(...params.map((p) => (p === undefined ? null : p))) : stmt;
}

export async function prepare(sql: string, ...params: Param[]): Promise<D1PreparedStatement> {
  return bindAll((await db()).prepare(sql), params);
}

export async function all<T>(sql: string, ...params: Param[]): Promise<T[]> {
  const { results } = await (await prepare(sql, ...params)).all<T>();
  return results;
}

export async function first<T>(sql: string, ...params: Param[]): Promise<T | null> {
  return (await prepare(sql, ...params)).first<T>();
}

/** Runs a write and returns how many rows it changed. */
export async function run(sql: string, ...params: Param[]): Promise<number> {
  const result = await (await prepare(sql, ...params)).run();
  return result.meta.changes;
}

/** Runs the statements as one transaction: all succeed or none apply. */
export async function batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
  if (statements.length === 0) return [];
  return (await db()).batch(statements);
}
