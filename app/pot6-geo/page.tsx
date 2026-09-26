"use client";

import { POT6_GEO_DAYS, POT6_GEO_SUBGROUPS, pot6Topics } from "@/lib/catalogs";
import { useStore } from "@/lib/store";

export default function POT6GeoPage() {
  const store = useStore();
  const codes = POT6_GEO_SUBGROUPS.flatMap((g) => g.codes);
  return (
    <div>
      <h1>POT 6 Geo</h1>
      <p className="muted">8-day geometry plan · Larson Ch 11 · not on the summer algebra calendar.</p>
      <p>{store.pot6GeoCompleted.length} / {codes.length} codes checked</p>
      {POT6_GEO_DAYS.map((day) => (
        <section key={day.day} className="card stack">
          <h3>Day {day.day} · {day.title}</h3>
          {day.potCodes.map((code) => {
            const topic = pot6Topics.find((t) => t.code === code);
            return (
              <label key={code} className="row">
                <input
                  type="checkbox"
                  checked={store.pot6GeoCompleted.includes(code)}
                  onChange={() => {
                    const next = store.pot6GeoCompleted.includes(code)
                      ? store.pot6GeoCompleted.filter((c) => c !== code)
                      : [...store.pot6GeoCompleted, code];
                    store.set({ pot6GeoCompleted: next });
                  }}
                />
                <span>{code} {topic ? `· ${topic.title}` : ""}</span>
              </label>
            );
          })}
        </section>
      ))}
      {POT6_GEO_SUBGROUPS.map((group) => (
        <section key={group.id}>
          <h2>{group.title}</h2>
          <div className="stack">
            {group.codes.map((code) => {
              const topic = pot6Topics.find((t) => t.code === code);
              return (
                <div className="card" key={code}>
                  <strong>{code}</strong> {topic?.title}
                  {topic ? <p className="muted">{topic.conceptSummary}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
