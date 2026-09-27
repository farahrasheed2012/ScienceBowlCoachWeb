export function CoachInsight({ kicker, body }: { kicker: string; body: string }) {
  return (
    <aside className="coach-insight">
      <p className="mission-kicker">{kicker}</p>
      <p>{body}</p>
    </aside>
  );
}
