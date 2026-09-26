const ENCYCLOPEDIA_TO_TOSSUP: Record<string, string> = {
  "ls-photosynthesis": "bio-energy",
  "ls-cellular-respiration": "bio-energy",
  "ls-cell-organelles": "bio-cells",
  "ls-cell-processes": "bio-cells",
  "ls-cell-division": "bio-cells",
  "ls-dna-rna": "bio-genetics",
  "ls-genetics": "bio-inheritance",
  "ls-mutations": "bio-genetics",
  "ls-evolution": "bio-evolution",
  "ls-classification": "bio-evolution",
  "ls-ecology": "bio-ecology",
  "ls-biomes": "bio-ecology",
  "ls-population-ecology": "bio-ecology",
  "ls-symbiosis": "bio-ecology",
  "ls-biodiversity": "bio-ecology",
  "ls-bacteria-viruses": "bio-microbes",
  "ls-immune": "bio-microbes",
  "ls-circulatory": "bio-body-systems",
  "ls-respiratory": "bio-body-systems",
  "ls-digestive": "bio-body-systems",
  "ls-nervous": "bio-body-systems",
  "ls-endocrine": "bio-body-systems",
  "ls-skeletal-muscular": "bio-body-systems",
  "ls-reproductive": "bio-body-systems",
  "ps-motion": "phys-motion",
  "ps-newtons-laws": "phys-forces",
  "ps-forces": "phys-forces",
  "ps-work-energy-power": "phys-energy",
  "ps-kinetic-potential": "phys-energy",
  "ch-atomic-structure": "chem-atoms-periodic-table",
  "ch-periodic-table": "chem-atoms-periodic-table",
  "math-pemdas": "math-number-sense",
};

const SUBJECT_TO_PRACTICE: Record<string, string> = {
  "Life Science": "biology",
  biology: "biology",
  "Physical Science": "physics",
  physics: "physics",
  Chemistry: "chemistry",
  chemistry: "chemistry",
  "Earth & Space Science": "earth",
  Energy: "physics",
  Math: "math",
  math: "math",
};

export function tossupTopicForEncyclopedia(topicId: string) {
  return ENCYCLOPEDIA_TO_TOSSUP[topicId];
}

export function practiceSubjectFor(label: string) {
  return SUBJECT_TO_PRACTICE[label] ?? label.toLowerCase();
}
