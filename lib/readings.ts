import { topicReadings } from "./catalogs";

export type Reading = { bookCode: string; label: string; role: string };

export function readingsFor(topicId: string): Reading[] {
  return topicReadings[topicId] ?? [];
}

function hasChapterOrPage(label: string) {
  return /\bCh\b|\bch\.?\b|§|p\d+|page/i.test(label);
}

function isIndexOrWeb(reading: Reading) {
  return /index:|websites|Tips & Resources/i.test(reading.label) || reading.bookCode.startsWith("DOE");
}

export function lookupLine(topicId: string): { primary?: string; book?: string } {
  const list = readingsFor(topicId);
  if (!list.length) return {};
  const primary = list.find((row) => row.role === "primary") ?? list[0];
  const book = list.find((row) => row !== primary && hasChapterOrPage(row.label))
    ?? list.find((row) => hasChapterOrPage(row.label));
  const primaryLine = `${primary.bookCode} · ${primary.label}`;
  if (hasChapterOrPage(primary.label) && !isIndexOrWeb(primary)) {
    return { primary: primaryLine };
  }
  return {
    primary: primaryLine,
    book: book && book !== primary ? `If you have the book: ${book.bookCode} · ${book.label}` : undefined,
  };
}

export function readingRoleLabel(role: string) {
  if (role === "primary") return "Primary";
  if (role === "backup") return "Backup";
  if (role === "alsoOK" || role === "pass2") return "Also OK";
  return role;
}

export { articleForLabel as topicForWeakTitle } from "./topic-map";
