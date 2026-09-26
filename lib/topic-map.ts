import tossUpTopicsJson from "@/data/tossup-topics.json";
import { topics } from "./catalogs";
import type { EncyclopediaTopic } from "./types";

const tossUpTopics = tossUpTopicsJson as { id: string; name: string }[];

const ENCYCLOPEDIA_TO_TOSSUP: Record<string, string> = {
  "ls-photosynthesis": "bio-energy",
  "ls-cellular-respiration": "bio-energy",
  "ls-reg-resp-photosyn": "bio-energy",
  "ls-cell-organelles": "bio-cells",
  "ls-cell-processes": "bio-cells",
  "ls-cell-division": "bio-cells",
  "ls-dna-rna": "bio-genetics",
  "ls-genetics": "bio-inheritance",
  "ls-mutations": "bio-genetics",
  "ls-reg-genetics": "bio-genetics",
  "ls-evolution": "bio-evolution",
  "ls-classification": "bio-evolution",
  "ls-reg-phyla": "bio-evolution",
  "ls-ecology": "bio-ecology",
  "ls-biomes": "bio-ecology",
  "ls-population-ecology": "bio-ecology",
  "ls-symbiosis": "bio-ecology",
  "ls-biodiversity": "bio-ecology",
  "ls-bacteria-viruses": "bio-microbes",
  "ls-immune": "bio-microbes",
  "ls-fungi-protists": "bio-microbes",
  "ls-plant-biology": "bio-cells",
  "ls-circulatory": "bio-body-systems",
  "ls-respiratory": "bio-body-systems",
  "ls-digestive": "bio-body-systems",
  "ls-nervous": "bio-body-systems",
  "ls-endocrine": "bio-body-systems",
  "ls-skeletal-muscular": "bio-body-systems",
  "ls-reproductive": "bio-body-systems",
  "ls-reg-anatomy": "bio-body-systems",
  "ps-motion": "phys-motion",
  "ps-reg-kinematics": "phys-motion",
  "ps-newtons-laws": "phys-forces",
  "ps-forces": "phys-forces",
  "ps-reg-forces": "phys-forces",
  "ps-momentum": "phys-forces",
  "ps-simple-machines": "phys-forces",
  "ps-work-energy-power": "phys-energy",
  "ps-kinetic-potential": "phys-energy",
  "ps-thermodynamics": "phys-energy",
  "en-forms": "phys-energy",
  "en-conservation": "phys-energy",
  "ps-waves": "phys-waves",
  "ps-sound": "phys-waves",
  "ps-light": "phys-waves",
  "ps-reflection-refraction": "phys-waves",
  "ps-optics": "phys-waves",
  "ps-reg-waves": "phys-waves",
  "ps-electricity": "phys-electricity",
  "ps-circuits": "phys-electricity",
  "ps-magnetism": "phys-magnetism",
  "ps-states-of-matter": "chem-states-of-matter",
  "ch-atomic-structure": "chem-atoms-periodic-table",
  "ch-periodic-table": "chem-atoms-periodic-table",
  "ch-elements-compounds": "chem-atoms-periodic-table",
  "ch-reg-nomenclature": "chem-atoms-periodic-table",
  "ch-reg-trends": "chem-atoms-periodic-table",
  "ch-chemical-bonds": "chem-bonding",
  "ch-chemical-reactions": "chem-reactions",
  "ch-reaction-types": "chem-reactions",
  "ch-redox": "chem-reactions",
  "ch-organic": "chem-reactions",
  "hewitt-ch17": "chem-atoms-periodic-table",
  "ch-acids-bases": "chem-solutions-acids",
  "ch-solutions": "chem-solutions-acids",
  "ch-reg-acids": "chem-solutions-acids",
  "ch-mole": "chem-stoichiometry",
  "ch-reg-gas-laws": "chem-stoichiometry",
  "ch-states-matter": "chem-states-of-matter",
  "math-pemdas": "math-number-sense",
  "math-number-theory": "math-number-sense",
  "math-fractions": "math-fractions-percent",
  "math-ratios": "math-ratios-proportions",
  "math-exponents": "math-exponents-sci-notation",
  "math-roots": "math-radicals",
  "math-algebra-expressions": "math-linear-equations",
  "math-linear-eq": "math-linear-equations",
  "math-systems": "math-linear-equations",
  "math-word-problems": "math-linear-equations",
  "math-functions": "math-graphs-slope",
  "math-coordinate": "math-graphs-slope",
  "math-data-graphs": "math-graphs-slope",
  "math-probability": "math-probability-stats",
  "math-statistics": "math-probability-stats",
};

const SUBJECT_TO_PRACTICE: Record<string, string> = {
  "Life Science": "biology",
  biology: "biology",
  "Physical Science": "physics",
  physics: "physics",
  Chemistry: "chemistry",
  chemistry: "chemistry",
  "Earth & Space Science": "earth",
  Energy: "energy",
  Math: "math",
  math: "math",
};

export function tossupTopicForEncyclopedia(topicId: string) {
  return ENCYCLOPEDIA_TO_TOSSUP[topicId];
}

export function practiceSubjectFor(label: string) {
  return SUBJECT_TO_PRACTICE[label] ?? label.toLowerCase();
}

export function tossupLabelForEncyclopedia(topicId: string) {
  const tossupId = ENCYCLOPEDIA_TO_TOSSUP[topicId];
  return tossUpTopics.find((topic) => topic.id === tossupId)?.name;
}

export function articleForLabel(label: string): EncyclopediaTopic | undefined {
  const needle = label.toLowerCase().trim();
  if (!needle) return undefined;
  const exact = topics.find((topic) => topic.title.toLowerCase() === needle);
  if (exact) return exact;
  const tossup = tossUpTopics.find((topic) => topic.id === needle || topic.name.toLowerCase() === needle);
  if (tossup) {
    const mappedId = Object.keys(ENCYCLOPEDIA_TO_TOSSUP).find((id) => ENCYCLOPEDIA_TO_TOSSUP[id] === tossup.id);
    const mapped = mappedId ? topics.find((topic) => topic.id === mappedId) : undefined;
    if (mapped) return mapped;
  }
  const parts = needle.split(/\s*(?:&|\/|,|\band\b)\s*/).map((part) => part.trim()).filter((part) => part.length > 3);
  for (const part of parts) {
    const hit = topics.find((topic) => topic.title.toLowerCase() === part);
    if (hit) return hit;
  }
  return topics.find((topic) => needle.includes(topic.title.toLowerCase()) && topic.title.length > 4)
    ?? topics.find((topic) => parts[0] && topic.title.toLowerCase().includes(parts[0]));
}

export function missesForArticle(title: string, wrong: Record<string, number>, topicId?: string) {
  const tossupName = topicId ? tossupLabelForEncyclopedia(topicId) : tossupLabelForEncyclopedia(articleForLabel(title)?.id ?? "");
  return (wrong[title] ?? 0) + (tossupName && tossupName !== title ? (wrong[tossupName] ?? 0) : 0);
}

export function accuracyForArticle<T extends { topic: string }>(title: string, stats: T[]) {
  const article = articleForLabel(title);
  const tossupId = article ? ENCYCLOPEDIA_TO_TOSSUP[article.id] : undefined;
  return stats.find((row) => {
    if (row.topic.toLowerCase() === title.toLowerCase()) return true;
    const mapped = articleForLabel(row.topic);
    if (mapped && article && mapped.id === article.id) return true;
    return Boolean(tossupId && mapped && ENCYCLOPEDIA_TO_TOSSUP[mapped.id] === tossupId);
  });
}
