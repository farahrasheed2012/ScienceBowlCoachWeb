export type MathCountsQ = { id: string; prompt: string; answer: string; explanation: string; topic: string };

function r(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function dailyMathCounts(level: number): MathCountsQ[] {
  const warmup = Array.from({ length: 5 }, (_, i) => {
    const a = r(10, 40 + level * 10);
    const b = r(2, 20);
    return { id: `w${i}`, prompt: `${a} + ${b}`, answer: String(a + b), explanation: `${a} + ${b} = ${a + b}.`, topic: "warmup" };
  });
  const sense = [
    { id: "s1", prompt: `What is 25% of ${20 * level + 40}?`, answer: String((20 * level + 40) / 4), explanation: "25% is a quarter.", topic: "number sense" },
    { id: "s2", prompt: `${12 + level}² = ?`, answer: String((12 + level) ** 2), explanation: "Square the number.", topic: "number sense" },
    { id: "s3", prompt: `GCF of ${12 * level} and ${18 * level}?`, answer: String(6 * level), explanation: "Factor both numbers.", topic: "number sense" },
  ];
  const challenge = [
    { id: "c1", prompt: "A right triangle has legs 6 and 8. What is the hypotenuse?", answer: "10", explanation: "6-8-10 is a scaled 3-4-5 triangle.", topic: "geometry" },
    { id: "c2", prompt: "How many positive divisors does 36 have?", answer: "9", explanation: "36 = 2²·3² so (2+1)(2+1)=9.", topic: "number theory" },
    { id: "c3", prompt: "If 3x + 6 = 21, what is x?", answer: "5", explanation: "3x = 15, x = 5.", topic: "algebra" },
  ];
  const stretch = [
    { id: "x1", prompt: "The 5th term of 3, 7, 11, … is?", answer: "19", explanation: "Arithmetic sequence +4; 3+16=19.", topic: "sequences" },
  ];
  return [...warmup, ...sense, ...challenge, ...stretch];
}

export const MATHCOUNTS_TOPICS = [
  "Number sense",
  "Fractions & percents",
  "Ratios",
  "Pre-algebra",
  "Geometry",
  "Counting",
  "Sequences",
];
