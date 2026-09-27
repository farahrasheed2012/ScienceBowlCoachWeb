import { NextResponse } from "next/server";
import { readProgress, readProgressByName, syncAvailable, writeProgress } from "@/lib/db";
import { isSyncCode, makeSyncCode, normalizeSyncCode } from "@/lib/sync-code";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim() ?? "";
  const code = normalizeSyncCode(url.searchParams.get("code") ?? "");
  if (!name && !code) {
    return NextResponse.json({ available: syncAvailable() });
  }
  if (!syncAvailable()) {
    return NextResponse.json({ error: "Sync is not configured." }, { status: 503 });
  }
  if (name) {
    const found = await readProgressByName(name);
    if (!found) return NextResponse.json({ error: "No locker for that name yet." }, { status: 404 });
    return NextResponse.json(found);
  }
  if (!isSyncCode(code)) {
    return NextResponse.json({ error: "That code looks wrong." }, { status: 400 });
  }
  const state = await readProgress(code);
  if (!state) return NextResponse.json({ error: "No progress for that code yet." }, { status: 404 });
  return NextResponse.json({ code, state });
}

export async function POST(request: Request) {
  if (!syncAvailable()) {
    return NextResponse.json({ error: "Sync is not configured." }, { status: 503 });
  }
  let body: { code?: string; state?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON." }, { status: 400 });
  }
  const requested = typeof body.code === "string" ? normalizeSyncCode(body.code) : "";
  const code = requested && isSyncCode(requested) ? requested : makeSyncCode();
  if (!body.state || typeof body.state !== "object") {
    return NextResponse.json({ error: "Missing progress." }, { status: 400 });
  }
  await writeProgress(code, body.state);
  return NextResponse.json({ code });
}
