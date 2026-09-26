import { NextResponse } from "next/server";

type Event = { at: string; name: string };

const rooms = globalThis as typeof globalThis & { __sbcBuzzer?: Map<string, Event[]> };
rooms.__sbcBuzzer ??= new Map();

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return NextResponse.json({ events: rooms.__sbcBuzzer!.get(code) ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const events = rooms.__sbcBuzzer!.get(code) ?? [];
  events.push({ at: new Date().toISOString(), name: String(body.name || "Player") });
  rooms.__sbcBuzzer!.set(code, events.slice(-40));
  return NextResponse.json({ ok: true });
}
