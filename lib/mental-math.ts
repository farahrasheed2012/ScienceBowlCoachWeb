export type MentalOp = "addition" | "subtraction" | "multiplication" | "division" | "squares" | "mixed";

export type MentalProblem = { prompt: string; answer: number };

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function one(op: Exclude<MentalOp, "mixed">, level: number): MentalProblem {
  switch (op) {
    case "addition": {
      const a = level < 3 ? rand(1, 20) : rand(10, 99);
      const b = level < 3 ? rand(1, 20) : rand(10, 99);
      return { prompt: `${a} + ${b}`, answer: a + b };
    }
    case "subtraction": {
      const a = level < 3 ? rand(5, 30) : rand(30, 199);
      const b = rand(1, a - 1);
      return { prompt: `${a} − ${b}`, answer: a - b };
    }
    case "multiplication": {
      const a = level < 3 ? rand(2, 9) : rand(6, 19);
      const b = level < 3 ? rand(2, 9) : rand(2, 12);
      return { prompt: `${a} × ${b}`, answer: a * b };
    }
    case "division": {
      const b = rand(2, 12);
      const answer = level < 3 ? rand(2, 12) : rand(4, 24);
      return { prompt: `${b * answer} ÷ ${b}`, answer };
    }
    case "squares": {
      const n = level < 3 ? rand(2, 12) : rand(11, 25);
      return { prompt: `${n}²`, answer: n * n };
    }
  }
}

export function mentalProblems(op: MentalOp, level: number, count = 20): MentalProblem[] {
  const ops: Exclude<MentalOp, "mixed">[] = ["addition", "subtraction", "multiplication", "division"];
  return Array.from({ length: count }, () => {
    const chosen = op === "mixed" ? ops[rand(0, ops.length - 1)] : op;
    return one(chosen, level);
  });
}
