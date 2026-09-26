"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function BuzzerHostPage() {
  const [code, setCode] = useState("");
  const [events, setEvents] = useState<{ at: string; name: string }[]>([]);

  useEffect(() => {
    const room = String(Math.floor(1000 + Math.random() * 9000));
    setCode(room);
    const timer = setInterval(async () => {
      const res = await fetch(`/api/buzzer/${room}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    }, 700);
    return () => clearInterval(timer);
  }, []);

  const url = typeof window !== "undefined" && code ? `${window.location.origin}/buzzer/${code}` : "";

  return (
    <div className="stack">
      <Link href="/settings">Back to Settings</Link>
      <h1>iPhone buzzer remote</h1>
      <p className="muted">Same idea as the Mac app: phone buzzes during a computer drill. Open the phone page on the same site. Works locally in `next dev`; on Vercel it works while both hit the same server instance.</p>
      <div className="card stack">
        <p>Room code</p>
        <h2>{code || "…"}</h2>
        {url ? <a href={url}>{url}</a> : null}
      </div>
      <div className="card stack">
        <h3>Buzzes</h3>
        {events.length === 0 ? <p className="muted">Waiting…</p> : events.map((e) => <p key={e.at}>{e.name} · {new Date(e.at).toLocaleTimeString()}</p>)}
      </div>
    </div>
  );
}
