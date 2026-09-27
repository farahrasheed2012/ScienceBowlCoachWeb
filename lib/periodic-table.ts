import catalog from "@/data/periodic_table.json";

export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth"
  | "transition-metal"
  | "post-transition"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble-gas"
  | "lanthanide"
  | "actinide"
  | "unknown";

export type PeriodicElement = {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: number;
  atomicMassLabel: string;
  group: number | null;
  period: number;
  category: ElementCategory;
  electronConfiguration: string;
  state: "solid" | "liquid" | "gas" | "unknown";
  meltingPointC: number | null;
  boilingPointC: number | null;
  oxidationStates: string | null;
  electronegativity: number | null;
  density: number | null;
  discoveryYear: number | null;
  discoverer: string | null;
  block: "s" | "p" | "d" | "f";
  occurrence: "natural" | "synthetic";
};

export type HighlightMode =
  | "all"
  | "metals"
  | "nonmetals"
  | "metalloids"
  | "noble-gases"
  | "halogens"
  | "transition-metals"
  | "lanthanides"
  | "actinides";

export type TrendId = "radius" | "ionization" | "electronegativity" | "affinity" | "metallic";

export type PeriodicStudy = {
  attempted: number;
  correct: number;
  streak: number;
  bestStreak: number;
};

export const PERIODIC_ELEMENTS = catalog.elements as PeriodicElement[];

export const emptyPeriodicStudy = (): PeriodicStudy => ({
  attempted: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
});

export const CATEGORY_LABEL: Record<ElementCategory, string> = {
  "alkali-metal": "Alkali metal",
  "alkaline-earth": "Alkaline earth metal",
  "transition-metal": "Transition metal",
  "post-transition": "Post-transition metal",
  metalloid: "Metalloid",
  nonmetal: "Nonmetal",
  halogen: "Halogen",
  "noble-gas": "Noble gas",
  lanthanide: "Lanthanide",
  actinide: "Actinide",
  unknown: "Unknown properties",
};

export const HIGHLIGHT_OPTIONS: { id: HighlightMode; label: string }[] = [
  { id: "all", label: "All" },
  { id: "metals", label: "Metals" },
  { id: "nonmetals", label: "Nonmetals" },
  { id: "metalloids", label: "Metalloids" },
  { id: "noble-gases", label: "Noble gases" },
  { id: "halogens", label: "Halogens" },
  { id: "transition-metals", label: "Transition metals" },
  { id: "lanthanides", label: "Lanthanides" },
  { id: "actinides", label: "Actinides" },
];

export const TRENDS: { id: TrendId; label: string; left: string; right: string; down: string; note: string }[] = [
  { id: "radius", label: "Atomic radius", left: "increases", right: "decreases", down: "increases", note: "More shells down a group. Stronger nuclear pull across a period." },
  { id: "ionization", label: "Ionization energy", left: "decreases", right: "increases", down: "decreases", note: "Harder to remove an electron as atoms get smaller and hold electrons tighter." },
  { id: "electronegativity", label: "Electronegativity", left: "decreases", right: "increases", down: "decreases", note: "Fluorine is the highest. Noble gases are usually omitted." },
  { id: "affinity", label: "Electron affinity", left: "decreases", right: "increases", down: "decreases", note: "Generally more negative (more energy released) toward the right, except noble gases." },
  { id: "metallic", label: "Metallic character", left: "increases", right: "decreases", down: "increases", note: "Metals on the left. Nonmetals on the right. Metalloids on the stair-step." },
];

const METAL_CATS = new Set<ElementCategory>([
  "alkali-metal", "alkaline-earth", "transition-metal", "post-transition", "lanthanide", "actinide",
]);

export function tilePosition(element: PeriodicElement) {
  const z = element.atomicNumber;
  if (z >= 57 && z <= 71) return { col: z - 57 + 3, row: 9 };
  if (z >= 89 && z <= 103) return { col: z - 89 + 3, row: 10 };
  return { col: element.group ?? 3, row: element.period };
}

export function matchesHighlight(element: PeriodicElement, mode: HighlightMode) {
  if (mode === "all") return true;
  if (mode === "metals") return METAL_CATS.has(element.category);
  if (mode === "nonmetals") return element.category === "nonmetal" || element.category === "halogen" || element.category === "noble-gas";
  if (mode === "metalloids") return element.category === "metalloid";
  if (mode === "noble-gases") return element.category === "noble-gas";
  if (mode === "halogens") return element.category === "halogen";
  if (mode === "transition-metals") return element.category === "transition-metal";
  if (mode === "lanthanides") return element.category === "lanthanide";
  return element.category === "actinide";
}

export function searchElements(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return new Set<number>();
  return new Set(
    PERIODIC_ELEMENTS
      .filter((element) => {
        const name = element.name.toLowerCase();
        const symbol = element.symbol.toLowerCase();
        if (String(element.atomicNumber) === needle) return true;
        if (symbol === needle) return true;
        if (needle.length === 1) return false;
        if (symbol.startsWith(needle) || name.startsWith(needle)) return true;
        return needle.length >= 3 && name.includes(needle);
      })
      .map((element) => element.atomicNumber),
  );
}

export function trendScore(element: PeriodicElement, trend: TrendId) {
  const period = element.period;
  const group = element.group ?? (element.category === "lanthanide" || element.category === "actinide" ? 3 : 9);
  const across = (group - 1) / 17;
  const down = (period - 1) / 6;
  if (trend === "radius" || trend === "metallic") return (1 - across) * 0.55 + down * 0.45;
  return across * 0.55 + (1 - down) * 0.45;
}

export const RELATED_TOPICS = [
  { id: "ch-atomic-structure", title: "Atomic Structure" },
  { id: "ch-periodic-table", title: "The Periodic Table" },
  { id: "ch-chemical-bonds", title: "Chemical Bonds" },
  { id: "ch-reg-trends", title: "Periodic Trends" },
  { id: "ch-elements-compounds", title: "Elements, Compounds & Mixtures" },
] as const;

const FAMOUS_NOTES: Record<string, string[]> = {
  H: ["Lightest element. Most abundant element in the universe."],
  He: ["Filled 1s shell. Least chemically reactive element."],
  C: ["Four valence electrons. Basis of organic chemistry."],
  N: ["About 78% of dry air. Triple bond in N₂ is very strong."],
  O: ["About 21% of air. Needed for respiration and combustion."],
  F: ["Highest electronegativity on the Pauling scale (3.98)."],
  Na: ["Group 1 metal. With chlorine it forms table salt, NaCl."],
  Fe: ["Common +2 / +3 ions. Central atom in hemoglobin."],
  Cu: ["Excellent electrical conductor. One of the coinage metals."],
  Ag: ["Best electrical conductor among the common metals."],
  Au: ["Very unreactive metal. Does not tarnish in air."],
  Hg: ["Only metal that is liquid at room temperature."],
  Br: ["Only nonmetal that is liquid at room temperature."],
  U: ["Used as nuclear fuel. Atomic number 92."],
};

export function scienceBowlNotes(element: PeriodicElement) {
  const notes = [...(FAMOUS_NOTES[element.symbol] ?? [])];
  if (element.group === 1 && element.symbol !== "H") notes.push("Group 1 alkali metal — one valence electron, very reactive.");
  if (element.group === 2) notes.push("Group 2 alkaline earth metal — two valence electrons.");
  if (element.group === 17) notes.push("Group 17 halogen — seven valence electrons, forms 1− ions.");
  if (element.group === 18) notes.push("Group 18 noble gas — full outer shell, least reactive group.");
  if (element.category === "metalloid") notes.push("On the metal / nonmetal stair-step. Intermediate properties.");
  if (element.category === "lanthanide") notes.push("f-block inner transition metal. Shown in the lanthanide row.");
  if (element.category === "actinide") notes.push("f-block inner transition metal. Shown in the actinide row. Many are radioactive.");
  if (element.occurrence === "synthetic") notes.push("Synthetic — not found in useful amounts in nature.");
  notes.push(`Electron configuration: ${element.electronConfiguration}.`);
  return notes;
}

export type StudyKind = "number" | "symbol" | "name";

export type StudyPrompt = {
  kind: StudyKind;
  element: PeriodicElement;
  prompt: string;
  answer: string;
};

export function nextStudyPrompt(previous?: number): StudyPrompt {
  let element = PERIODIC_ELEMENTS[Math.floor(Math.random() * PERIODIC_ELEMENTS.length)];
  if (previous != null && PERIODIC_ELEMENTS.length > 1) {
    while (element.atomicNumber === previous) {
      element = PERIODIC_ELEMENTS[Math.floor(Math.random() * PERIODIC_ELEMENTS.length)];
    }
  }
  const kind = (["number", "symbol", "name"] as const)[Math.floor(Math.random() * 3)];
  if (kind === "number") {
    return { kind, element, prompt: `Which element has atomic number ${element.atomicNumber}?`, answer: element.name };
  }
  if (kind === "symbol") {
    return { kind, element, prompt: `What is the symbol for ${element.name}?`, answer: element.symbol };
  }
  return { kind, element, prompt: `Which element is represented by ${element.symbol}?`, answer: element.name };
}

export function studyCorrect(prompt: StudyPrompt, guess: string) {
  const text = guess.trim();
  if (!text) return false;
  if (prompt.kind === "symbol") return text.toLowerCase() === prompt.answer.toLowerCase();
  const a = prompt.answer.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const b = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return a === b || a === b.replace(/aluminium/g, "aluminum");
}

export function applyStudyResult(prev: PeriodicStudy, correct: boolean): PeriodicStudy {
  const streak = correct ? prev.streak + 1 : 0;
  return {
    attempted: prev.attempted + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(prev.bestStreak, streak),
  };
}

export function hydratePeriodicStudy(raw: unknown): PeriodicStudy {
  const value = raw && typeof raw === "object" ? raw as Partial<PeriodicStudy> : {};
  return {
    attempted: Number(value.attempted) || 0,
    correct: Number(value.correct) || 0,
    streak: Number(value.streak) || 0,
    bestStreak: Number(value.bestStreak) || 0,
  };
}

export function formatTemp(value: number | null) {
  return value == null ? "—" : `${value} °C`;
}

export function formatDensity(value: number | null) {
  return value == null ? "—" : `${value} g/cm³`;
}
