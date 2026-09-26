import topicsJson from "@/data/topics.json";
import questionsJson from "@/data/questions.json";
import hewittJson from "@/data/hewitt_ch17_questions.json";
import readingsJson from "@/data/topic_readings.json";
import doeStarterJson from "@/data/doe_starter_cache.json";
import blocksJson from "@/data/study-blocks.json";
import sprintJson from "@/data/regional-sprint.json";
import type {
  DoeQuestion,
  EncyclopediaQuestion,
  EncyclopediaTopic,
  StudyBlock,
} from "./types";

export const topics = topicsJson as EncyclopediaTopic[];
export const encyclopediaQuestions = [
  ...(questionsJson as EncyclopediaQuestion[]),
  ...(hewittJson as EncyclopediaQuestion[]),
];
export const topicReadings = readingsJson as Record<
  string,
  { bookCode: string; label: string; role: string }[]
>;
export const doeStarter = doeStarterJson as DoeQuestion[];
export const studyBlocks = blocksJson as StudyBlock[];
export const regionalSprint = sprintJson as {
  id: string;
  track: string;
  title: string;
  subtitle: string;
  topicId: string;
  knowCold: string[];
  tossups: { question: string; answer: string }[];
}[];

export const NSB_SUBJECTS = [
  "Life Science",
  "Physical Science",
  "Chemistry",
  "Earth & Space Science",
  "Energy",
  "Math",
] as const;

export const WEEK_THEMES: Record<number, string> = {
  1: "Atoms · cells · motion",
  2: "Matter · genetics · Newton's",
  3: "Solutions · ecology · forces",
  4: "Evolution · the atom · momentum",
  5: "Energy in life & physics",
  6: "Ecology & solutions",
  7: "Immunity & heat",
  8: "Plants & electricity",
  9: "Magnetism · waves · body systems",
  10: "Summer capstone",
  11: "Bio/Phys week 9",
  12: "Bio/Phys week 10 · finish",
};

export const BUZZER_SLOTS = [
  { weekday: "monday", label: "Mon free 12:40 – 1:30", subject: "chemistry", duration: "10 min" },
  { weekday: "tuesday", label: "Tue free 3:00 PM+", subject: "biology", duration: "15 min" },
  { weekday: "wednesday", label: "Wed free 3:55 PM+", subject: "physics", duration: "10 min" },
  { weekday: "thursday", label: "Thu free 1:10 – 2:00", subject: "biology", duration: "15 min mixed" },
  { weekday: "friday", label: "7:30 – 8:00 PM (optional)", subject: "biology", duration: "15 min" },
];

export const CHECKLIST_SEED = [
  { id: "bio-1", subject: "biology" as const, category: "Cell biology", description: "Cell structure — nucleus, mitochondria, ribosomes, chloroplast, cell wall, membrane" },
  { id: "bio-2", subject: "biology" as const, category: "Cell biology", description: "Photosynthesis & respiration — inputs/outputs · chloroplast vs mitochondria · ATP" },
  { id: "bio-3", subject: "biology" as const, category: "Genetics", description: "DNA & heredity — gene, chromosome, allele · Punnett squares · dominant/recessive" },
  { id: "bio-4", subject: "biology" as const, category: "Anatomy & physiology", description: "Human body systems — digestive, circulatory, respiratory, nervous" },
  { id: "bio-5", subject: "biology" as const, category: "Ecology", description: "Ecology & animal behavior — food webs · biomes · symbiosis" },
  { id: "bio-6", subject: "biology" as const, category: "Ecology", description: "Evolution & classification — natural selection · binomial names" },
  { id: "bio-7", subject: "biology" as const, category: "Cell biology", description: "Microorganisms & disease — bacteria vs virus · vaccines" },
  { id: "bio-8", subject: "biology" as const, category: "Plant biology", description: "Plants & animals — root/stem/leaf · tissues · life cycles" },
  { id: "chem-1", subject: "chemistry" as const, category: "Periodic table", description: "Atoms & periodic table — p/n/e · atomic # vs mass # · first 20 symbols" },
  { id: "chem-2", subject: "chemistry" as const, category: "Reactions", description: "Ions & compounds — ionic vs covalent · H₂O, CO₂, NaCl" },
  { id: "chem-3", subject: "chemistry" as const, category: "Reactions", description: "Chemical reactions — balance equations · exo/endothermic" },
  { id: "chem-4", subject: "chemistry" as const, category: "Reactions", description: "Acids, bases & pH — scale 0–14 · H⁺/OH⁻" },
  { id: "chem-5", subject: "chemistry" as const, category: "States of matter", description: "States of matter — particle model · phase changes" },
  { id: "chem-6", subject: "chemistry" as const, category: "Reactions", description: "Solutions — solvent/solute · saturation · concentration" },
  { id: "chem-7", subject: "chemistry" as const, category: "Lab skills", description: "Lab & equipment — SI units · safety" },
  { id: "phys-1", subject: "physics" as const, category: "Motion", description: "Motion — speed, velocity, acceleration · v = d/t" },
  { id: "phys-2", subject: "physics" as const, category: "Forces", description: "Forces & Newton's laws — F = ma · friction" },
  { id: "phys-3", subject: "physics" as const, category: "Thermodynamics", description: "Work, energy & heat — W = Fd · KE/PE" },
  { id: "phys-4", subject: "physics" as const, category: "Waves", description: "Waves & light — v = fλ · reflection/refraction" },
  { id: "phys-5", subject: "physics" as const, category: "Electromagnetism", description: "Electricity — V = IR · series vs parallel" },
  { id: "phys-6", subject: "physics" as const, category: "Thermodynamics", description: "Energy conservation — heat vs temperature" },
  { id: "elem-1", subject: "chemistry" as const, category: "Periodic table", description: "First 20 element symbols (H–Ca) mastered" },
];

export const FORMULAS = {
  physics: [
    { text: "v = d/t", use: "Speed from distance and time" },
    { text: "F = ma", use: "Force, mass, acceleration" },
    { text: "W = Fd", use: "Work" },
    { text: "P = W/t", use: "Power" },
    { text: "V = IR", use: "Ohm's law" },
    { text: "v = fλ", use: "Wave speed, frequency, wavelength" },
    { text: "PE = mgh", use: "Gravitational potential energy" },
    { text: "KE = ½mv²", use: "Kinetic energy" },
  ],
  chemistry: [
    { text: "Z = # protons", use: "Atomic number defines the element" },
    { text: "A = p + n", use: "Mass number" },
    { text: "M = mol/L", use: "Molarity" },
    { text: "d = m/V", use: "Density" },
  ],
  biology: [
    { text: "Photosynthesis", use: "Chloroplast · CO₂ + H₂O + light → glucose + O₂" },
    { text: "Cellular respiration", use: "Mitochondria · glucose + O₂ → CO₂ + H₂O + ATP" },
  ],
};
