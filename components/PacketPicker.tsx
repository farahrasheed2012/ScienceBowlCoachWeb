"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { officialPacketGroups } from "@/lib/questions";
import type { DoeQuestion } from "@/lib/types";

export function PacketPicker({ importedDoe }: { importedDoe: DoeQuestion[] }) {
  const groups = useMemo(() => officialPacketGroups(importedDoe), [importedDoe]);
  const [label, setLabel] = useState(groups[0]?.label ?? "");
  const selected = groups.find((group) => group.label === label) ?? groups[0];
  const [round, setRound] = useState(selected?.rounds[0]?.round ?? 1);
  const currentRound = selected?.rounds.find((item) => item.round === round) ?? selected?.rounds[0];
  if (!selected) return null;
  const href = `/practice/play?mode=packet&packet=${encodeURIComponent(selected.label)}&round=${currentRound?.round ?? round}`;
  return (
    <div className="card stack">
      <h3>Official packets</h3>
      <p className="muted">DOE set → round → question, including Round Robin and Double Elim. Meet order, not mixed.</p>
      <div className="row">
        <select
          value={selected.label}
          onChange={(e) => {
            const next = groups.find((group) => group.label === e.target.value);
            setLabel(e.target.value);
            setRound(next?.rounds[0]?.round ?? 1);
          }}
        >
          {groups.map((group) => (
            <option key={group.label} value={group.label}>
              {group.label} · {group.rounds.length} {group.rounds.length === 1 ? "round" : "rounds"}
            </option>
          ))}
        </select>
        <select value={String(currentRound?.round ?? round)} onChange={(e) => setRound(Number(e.target.value))}>
          {selected.rounds.map((item) => (
            <option key={item.round} value={item.round}>
              Round {item.round} · {item.count} questions
            </option>
          ))}
        </select>
        <Link className="btn" href={href}>Start packet</Link>
      </div>
    </div>
  );
}
