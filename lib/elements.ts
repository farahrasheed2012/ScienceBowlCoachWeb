export type ElementInfo = {
  symbol: string;
  name: string;
  atomicNumber: number;
  group: number;
  period: number;
  category: string;
};

export const FIRST20: ElementInfo[] = [
  { symbol: "H", name: "Hydrogen", atomicNumber: 1, group: 1, period: 1, category: "Nonmetal" },
  { symbol: "He", name: "Helium", atomicNumber: 2, group: 18, period: 1, category: "Noble gas" },
  { symbol: "Li", name: "Lithium", atomicNumber: 3, group: 1, period: 2, category: "Alkali metal" },
  { symbol: "Be", name: "Beryllium", atomicNumber: 4, group: 2, period: 2, category: "Alkaline earth" },
  { symbol: "B", name: "Boron", atomicNumber: 5, group: 13, period: 2, category: "Metalloid" },
  { symbol: "C", name: "Carbon", atomicNumber: 6, group: 14, period: 2, category: "Nonmetal" },
  { symbol: "N", name: "Nitrogen", atomicNumber: 7, group: 15, period: 2, category: "Nonmetal" },
  { symbol: "O", name: "Oxygen", atomicNumber: 8, group: 16, period: 2, category: "Nonmetal" },
  { symbol: "F", name: "Fluorine", atomicNumber: 9, group: 17, period: 2, category: "Halogen" },
  { symbol: "Ne", name: "Neon", atomicNumber: 10, group: 18, period: 2, category: "Noble gas" },
  { symbol: "Na", name: "Sodium", atomicNumber: 11, group: 1, period: 3, category: "Alkali metal" },
  { symbol: "Mg", name: "Magnesium", atomicNumber: 12, group: 2, period: 3, category: "Alkaline earth" },
  { symbol: "Al", name: "Aluminum", atomicNumber: 13, group: 13, period: 3, category: "Metalloid" },
  { symbol: "Si", name: "Silicon", atomicNumber: 14, group: 14, period: 3, category: "Metalloid" },
  { symbol: "P", name: "Phosphorus", atomicNumber: 15, group: 15, period: 3, category: "Nonmetal" },
  { symbol: "S", name: "Sulfur", atomicNumber: 16, group: 16, period: 3, category: "Nonmetal" },
  { symbol: "Cl", name: "Chlorine", atomicNumber: 17, group: 17, period: 3, category: "Halogen" },
  { symbol: "Ar", name: "Argon", atomicNumber: 18, group: 18, period: 3, category: "Noble gas" },
  { symbol: "K", name: "Potassium", atomicNumber: 19, group: 1, period: 4, category: "Alkali metal" },
  { symbol: "Ca", name: "Calcium", atomicNumber: 20, group: 2, period: 4, category: "Alkaline earth" },
];
