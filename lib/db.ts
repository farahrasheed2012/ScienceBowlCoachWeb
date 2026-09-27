import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

export function syncAvailable() {
  return Boolean(databaseUrl());
}

function getSql() {
  if (!sql) {
    const url = databaseUrl();
    if (!url) throw new Error("DATABASE_URL is not set");
    sql = neon(url);
  }
  return sql;
}

export async function ensureProgressSchema() {
  if (!syncAvailable()) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      const q = getSql();
      await q`
        CREATE TABLE IF NOT EXISTS sbc_web_progress (
          code TEXT PRIMARY KEY,
          state JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  await schemaReady;
}

export async function readProgress(code: string) {
  await ensureProgressSchema();
  const rows = await getSql()`
    SELECT state FROM sbc_web_progress WHERE code = ${code} LIMIT 1
  `;
  return (rows[0]?.state as Record<string, unknown> | undefined) ?? null;
}

export async function readProgressByName(name: string) {
  await ensureProgressSchema();
  const key = name.trim().toLowerCase();
  if (!key) return null;
  const rows = await getSql()`
    SELECT code, state FROM sbc_web_progress
    WHERE lower(trim(coalesce(state->>'studentName', ''))) = ${key}
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    code: String(row.code),
    state: row.state as Record<string, unknown>,
  };
}

export async function writeProgress(code: string, state: unknown) {
  await ensureProgressSchema();
  const payload = JSON.stringify(state);
  await getSql()`
    INSERT INTO sbc_web_progress (code, state, updated_at)
    VALUES (${code}, ${payload}::jsonb, now())
    ON CONFLICT (code) DO UPDATE SET
      state = EXCLUDED.state,
      updated_at = now()
  `;
}
