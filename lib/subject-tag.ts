/** Official DOE MS labels, plus a practice subject for Physical Science. */

const CHEM = /\b(periodic table|atomic (?:number|mass|radius|weight)|isotope|ion(?:ic)?|covalent|molecule|compound|acid|base|\bpH\b|molar|oxidation|reduction|valence|electron (?:shell|cloud|configuration)|proton|neutron|solute|solvent|precipitat|catalyst|halogen|alkali|noble gas|chemical (?:formula|bond|reaction|equation)|avogadro|stoichiometr|endothermic|exothermic|reactant|ionic compound|hydrogen peroxide|sodium chloride|atomic particle|neutral atom|electron)\b/i;
const PHYS = /\b(newton|force|accelerat|velocity|momentum|inertia|friction|kinetic energy|potential energy|wavelength|frequency|circuit|ohm|volt(?:age)?|ampere|amperage|magnet|optics|lens|mirror|refraction|reflection|photon|joule|watt|vector|displacement|gravitational|static electricity|class (?:one|1|two|2|three|3) lever|inclined plane)\b/i;
const BIO = /\b(cell|organism|photosynth|mitosis|meiosis|gene|dna|enzyme|bacteria|virus|species|ecosystem|chlorophyll|mitochond|chromosome|allele|habitat|predator|amphibian|arthropod|protein|blood|organelle|taxonomy|photosynthetic)\b/i;

export function officialBucket(raw: string) {
  const upper = raw.toUpperCase();
  if (upper.includes("LIFE") || (/\bBIO/.test(upper) && !upper.includes("PHYSICAL"))) return "Biology";
  if (upper.includes("CHEM")) return "Chemistry";
  if (upper.includes("PHYSICAL SCIENCE") || upper.trim() === "PHYSICAL") return "Physical Science";
  if (upper.includes("EARTH") || upper.includes("SPACE") || upper.includes("ASTRO")) return "Earth and Space";
  if (upper.includes("ENERGY")) return "Energy";
  if (upper.includes("MATH")) return "Math";
  if (upper.includes("PHYS")) return "Physics";
  if (upper.includes("GENERAL")) return "General Science";
  return raw.trim() || "General Science";
}

function score(text: string, pattern: RegExp) {
  return text.match(new RegExp(pattern.source, "gi"))?.length ?? 0;
}

function splitPhysicalScience(text: string) {
  const chem = score(text, CHEM);
  const phys = score(text, PHYS);
  if (chem > phys) return "Chemistry";
  if (phys > chem) return "Physics";
  if (/\b(atom|ion|element|molecule|compound|periodic|isotope)\b/i.test(text)) return "Chemistry";
  return "Physics";
}

function splitGeneralScience(text: string) {
  const bio = score(text, BIO);
  const chem = score(text, CHEM);
  const phys = score(text, PHYS);
  const top = Math.max(bio, chem, phys);
  if (top < 2) return "General Science";
  if (bio === top && bio > chem && bio > phys) return "Biology";
  if (chem === top && chem > bio && chem > phys) return "Chemistry";
  if (phys === top && phys > bio && phys > chem) return "Physics";
  return "General Science";
}

export function practiceSubject(category: string, questionText = "", answer = "") {
  const text = `${questionText} ${answer}`;
  const bucket = officialBucket(category);
  if (bucket === "Physical Science") return splitPhysicalScience(text);
  if (bucket === "Physics") {
    const chem = score(text, CHEM);
    const phys = score(text, PHYS);
    if (chem >= phys + 1 && chem >= 1) return "Chemistry";
    return "Physics";
  }
  if (bucket === "General Science") return splitGeneralScience(text);
  return bucket;
}

export function packetInfo(sourceFile?: string, setNumber?: number, roundNumber?: number) {
  const file = (sourceFile ?? "").toLowerCase();
  const rr = file.match(/rr(\d+)/) || file.match(/round[\s_-]*robin[\s_-]*(\d+)/);
  if (rr || file.includes("round-robin") || file.startsWith("rr")) {
    const n = Number(rr?.[1] || roundNumber || 0);
    return { kind: "round-robin" as const, label: n ? `Round Robin ${n}` : "Round Robin", setNumber: 0, roundNumber: n || roundNumber || 1 };
  }
  const de = file.match(/de(\d+)/) || file.match(/double[\s_-]*elim(?:ination)?[\s_-]*(\d+)/);
  if (de || file.includes("double-elim") || file.startsWith("de")) {
    const n = Number(de?.[1] || roundNumber || 0);
    return { kind: "double-elim" as const, label: n ? `Double Elim ${n}` : "Double Elim", setNumber: 0, roundNumber: n || roundNumber || 1 };
  }
  return {
    kind: "set" as const,
    label: setNumber ? `Set ${setNumber}` : "Official packet",
    setNumber: setNumber ?? 0,
    roundNumber: roundNumber ?? 1,
  };
}
