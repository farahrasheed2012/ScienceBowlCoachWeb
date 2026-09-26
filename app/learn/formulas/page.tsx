"use client";

import Link from "next/link";
import { FORMULAS } from "@/lib/catalogs";
import { SpeechBar } from "@/components/SpeechBar";
import { isSchoolYear } from "@/lib/schedule";

const GROUPS = [
  { id: "biology", title: "Biology" },
  { id: "chemistry", title: "Chemistry" },
  { id: "physics", title: "Physics" },
  { id: "earth", title: "Earth & Space" },
  { id: "energy", title: "Energy" },
] as const;

export default function FormulasPage() {
  const spoken = GROUPS.flatMap((group) => FORMULAS[group.id].map((item) => `${item.text}. ${item.use}`)).join(". ");
  return (
    <div className="stack">
      <Link href="/learn">Back to Learn</Link>
      <div>
        <h1>Formulas & know-cold</h1>
        <p className="muted">
          {isSchoolYear()
            ? "School year keep-sharp. Same Mac formula sheet — Earth and Energy added because summer skipped them."
            : "Same Mac formula sheet. Use these during a science block, then drill."}
        </p>
      </div>
      <SpeechBar text={spoken} />
      {GROUPS.map((group) => (
        <section className="card stack" key={group.id}>
          <h3>{group.title}</h3>
          {FORMULAS[group.id].map((item) => (
            <p key={item.text}><strong>{item.text}.</strong> {item.use}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
