"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyStudyResult,
  CATEGORY_LABEL,
  formatDensity,
  formatDiscovery,
  formatTemp,
  HIGHLIGHT_OPTIONS,
  matchesHighlight,
  nextStudyPrompt,
  PERIODIC_ELEMENTS,
  RELATED_TOPICS,
  scienceBowlNotes,
  searchElements,
  studyCorrect,
  tilePosition,
  TRENDS,
  trendScore,
  type HighlightMode,
  type PeriodicElement,
  type StudyPrompt,
  type TrendId,
} from "@/lib/periodic-table";
import { useStore } from "@/lib/store";

export default function PeriodicTablePage() {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<HighlightMode>("all");
  const [trend, setTrend] = useState<TrendId | "">("");
  const [selected, setSelected] = useState<PeriodicElement | null>(null);
  const [study, setStudy] = useState(false);
  const [prompt, setPrompt] = useState<StudyPrompt>(() => nextStudyPrompt());
  const [guess, setGuess] = useState("");
  const [verdict, setVerdict] = useState<"idle" | "ok" | "bad">("idle");
  const searchRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<number>(0);

  const hits = useMemo(() => searchElements(query), [query]);
  const searching = query.trim().length > 0;
  const stats = store.periodicStudy;
  const accuracy = stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0;
  const trendMeta = TRENDS.find((row) => row.id === trend);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(advanceTimer.current);
    };
  }, []);

  function open(element: PeriodicElement) {
    setSelected(element);
  }

  function nextQuestion() {
    window.clearTimeout(advanceTimer.current);
    setPrompt(nextStudyPrompt(prompt.element.atomicNumber));
    setGuess("");
    setVerdict("idle");
  }

  function checkStudy() {
    const text = guess.trim();
    if (!text || verdict === "ok") return;
    const ok = studyCorrect(prompt, guess);
    if (verdict === "bad" && !ok) return;
    setVerdict(ok ? "ok" : "bad");
    store.set({ periodicStudy: applyStudyResult(store.periodicStudy, ok) });
    if (ok) {
      advanceTimer.current = window.setTimeout(nextQuestion, 650);
    }
  }

  return (
    <div className="pt-page">
      <div>
        <p className="mission-kicker">Chemistry reference</p>
        <h1>Periodic Table</h1>
        <p className="muted">Explore an element, read what Science Bowl actually asks, then prove you remember it.</p>
      </div>

      <div className="pt-toolbar">
        <label className="pt-search">
          <span className="faint">Search</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Oxygen, O, or 8"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search elements by name, symbol, or number"
          />
        </label>
        <label>
          <span className="faint">Category</span>
          <select value={highlight} onChange={(event) => setHighlight(event.target.value as HighlightMode)} aria-label="Highlight by category">
            {HIGHLIGHT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="faint">Trend</span>
          <select value={trend} onChange={(event) => setTrend(event.target.value as TrendId | "")} aria-label="Show a periodic trend">
            <option value="">None</option>
            {TRENDS.map((row) => (
              <option key={row.id} value={row.id}>{row.label}</option>
            ))}
          </select>
        </label>
        <button className="btn" type="button" onClick={() => setStudy((value) => !value)}>
          {study ? "Close study" : "Study Periodic Table"}
        </button>
      </div>

      {trendMeta ? (
        <section className="pt-trend">
          <p className="play-kicker chem">{trendMeta.label}</p>
          <p className="pt-trend-dir"><span>← {trendMeta.left}</span><span>{trendMeta.right} →</span></p>
          <p className="faint">Down a group: {trendMeta.down}. {trendMeta.note}</p>
        </section>
      ) : null}

      {study ? (
        <section className="pt-study">
          <p className="mission-kicker">Study mode</p>
          <h2 className="session-title">{prompt.prompt}</h2>
          <form
            className="row"
            onSubmit={(event) => {
              event.preventDefault();
              checkStudy();
            }}
          >
            <input
              type="text"
              value={guess}
              onChange={(event) => {
                if (verdict === "ok") return;
                setGuess(event.target.value);
                setVerdict("idle");
              }}
              placeholder="Answer"
              aria-label="Study answer"
            />
            <button className="btn" type="submit" disabled={verdict === "ok"}>Check</button>
            <button
              className="btn ghost"
              type="button"
              onClick={nextQuestion}
            >
              Skip
            </button>
          </form>
          {verdict === "ok" ? <p className="ok-text">Exactly. {prompt.answer}</p> : null}
          {verdict === "bad" ? <p className="muted">Not {guess.trim() || "that"}. Try again, or skip.</p> : null}
          <p className="faint">{stats.correct}/{stats.attempted || 0} correct · {accuracy}% · streak {stats.streak} · best {stats.bestStreak}</p>
        </section>
      ) : (
        <p className="faint">{stats.attempted ? `${stats.correct}/${stats.attempted} study answers · streak ${stats.streak}` : "Study mode is local — no account."}</p>
      )}

      <div className="pt-scroll">
        <div className="pt-board" role="grid" aria-label="Periodic table of the elements">
          <div className="pt-slot" style={{ gridColumn: 3, gridRow: 6 }} aria-hidden="true">
            <span className="faint">57–71</span>
          </div>
          <div className="pt-slot" style={{ gridColumn: 3, gridRow: 7 }} aria-hidden="true">
            <span className="faint">89–103</span>
          </div>
          <p className="pt-row-label" style={{ gridColumn: "1 / 3", gridRow: 9 }}>Lanthanides</p>
          <p className="pt-row-label" style={{ gridColumn: "1 / 3", gridRow: 10 }}>Actinides</p>
          {PERIODIC_ELEMENTS.map((element) => {
            const pos = tilePosition(element);
            const dim = (searching && !hits.has(element.atomicNumber)) || !matchesHighlight(element, highlight);
            const hit = searching && hits.has(element.atomicNumber);
            const heat = trend ? trendScore(element, trend) : 0;
            return (
              <button
                key={element.atomicNumber}
                type="button"
                role="gridcell"
                className={`pt-tile cat-${element.category}${dim ? " is-dim" : ""}${hit ? " is-hit" : ""}`}
                style={{
                  gridColumn: pos.col,
                  gridRow: pos.row,
                  ["--heat" as string]: trend ? String(0.22 + heat * 0.78) : undefined,
                }}
                onClick={() => open(element)}
                aria-label={`${element.name}, ${element.symbol}, atomic number ${element.atomicNumber}, ${CATEGORY_LABEL[element.category]}`}
              >
                <span className="pt-z">{element.atomicNumber}</span>
                <strong>{element.symbol}</strong>
                <span className="pt-name">{element.name}</span>
                <span className="pt-mass">{element.atomicMassLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="faint">{PERIODIC_ELEMENTS.length} elements. Color is category — each tile is also named, and the detail panel spells the family out.</p>

      {selected ? (
        <div className="pt-sheet" role="presentation" onClick={() => setSelected(null)}>
          <aside
            className="pt-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pt-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="text-btn session-leave" type="button" onClick={() => setSelected(null)}>Close</button>
            <p className="mission-kicker">{CATEGORY_LABEL[selected.category]} · Period {selected.period}{selected.group ? ` · Group ${selected.group}` : ""}</p>
            <h2 id="pt-detail-title" className="mission-hello">{selected.name}</h2>
            <p className="session-title">{selected.symbol}</p>
            <p className="muted">Atomic number {selected.atomicNumber} · {selected.atomicMassLabel} u · {selected.block}-block · {selected.occurrence}</p>
            <section>
              <p className="play-kicker chem">Properties</p>
              <ul className="pt-facts">
                <li>State at room temperature: {selected.state}</li>
                <li>Melting point: {formatTemp(selected.meltingPointC)}</li>
                <li>Boiling point: {formatTemp(selected.boilingPointC)}</li>
                <li>Electronegativity: {selected.electronegativity ?? "—"}</li>
                <li>Density: {formatDensity(selected.density)}</li>
                <li>Oxidation states: {selected.oxidationStates ?? "—"}</li>
                <li>Discovered: {formatDiscovery(selected)}</li>
              </ul>
            </section>
            <section>
              <p className="play-kicker chem">Electron configuration</p>
              <p className="pt-config">{selected.electronConfiguration}</p>
            </section>
            <section>
              <p className="play-kicker chem">Science Bowl notes</p>
              <ul className="pt-facts">
                {scienceBowlNotes(selected).map((note) => <li key={note}>{note}</li>)}
              </ul>
            </section>
            <section>
              <p className="play-kicker chem">Related Science Bowl topics</p>
              <div className="row">
                {RELATED_TOPICS.map((topic) => (
                  <Link key={topic.id} className="btn ghost" href={`/learn/${topic.id}`}>{topic.title}</Link>
                ))}
                <Link className="btn ghost" href="/practice/play?mode=topic&topic=chem-atoms-periodic-table">Practice atoms</Link>
                <Link className="btn ghost" href="/elements">H–Ca drill</Link>
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
