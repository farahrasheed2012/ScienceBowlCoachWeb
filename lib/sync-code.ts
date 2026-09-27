const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeSyncCode(raw: string) {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function formatSyncCode(raw: string) {
  const code = normalizeSyncCode(raw);
  if (code.length === 8) return `${code.slice(0, 4)}-${code.slice(4)}`;
  return code;
}

export function makeSyncCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPH[byte % ALPH.length]).join("");
}

export function isSyncCode(raw: string) {
  return normalizeSyncCode(raw).length === 8;
}
