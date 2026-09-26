export const WORDLE_BANK = [
  "ACIDS", "ALGAE", "AMINO", "ATOMS", "BONDS", "BRAIN", "CELLS", "COMET", "CYCLE",
  "EARTH", "FORCE", "FUNGI", "GENES", "GLAND", "IONIC", "LASER", "LIGHT", "LUNAR",
  "MAGMA", "METAL", "MOLES", "NOBLE", "OCEAN", "OPTIC", "ORBIT", "ORGAN", "OXIDE",
  "PHASE", "PLANT", "PRISM", "QUARK", "RADIO", "REACT", "SALTS", "SOLAR", "SOLID",
  "SOUND", "SPACE", "SPARK", "SPORE", "STARS", "STEAM", "SUGAR", "TIDES", "TOXIN",
  "TRAIT", "VAPOR", "VIRUS", "VOLTS", "WATER", "WAVES", "YEAST",
];

export const TRUE_FALSE = [
  { id: "tf1", statement: "Photosynthesis occurs in the chloroplasts of plant cells.", isTrue: true, hint: "Chloroplasts capture light energy.", subject: "biology" },
  { id: "tf2", statement: "The mitochondria is the site of cellular respiration.", isTrue: true, hint: "Mitochondria produce ATP.", subject: "biology" },
  { id: "tf3", statement: "Animal cells have a rigid cell wall made of cellulose.", isTrue: false, hint: "Plant cells have cell walls; animal cells do not.", subject: "biology" },
  { id: "tf4", statement: "DNA is found in the nucleus of eukaryotic cells.", isTrue: true, hint: "The nucleus stores genetic material.", subject: "biology" },
  { id: "tf5", statement: "All bacteria are harmful to humans.", isTrue: false, hint: "Many bacteria are beneficial.", subject: "biology" },
  { id: "tf6", statement: "Osmosis is the diffusion of water across a membrane.", isTrue: true, hint: "Water moves from high to low concentration.", subject: "biology" },
  { id: "tf7", statement: "Ribosomes are found only in the nucleus.", isTrue: false, hint: "Ribosomes are in cytoplasm and on ER.", subject: "biology" },
  { id: "tf8", statement: "Meiosis produces four genetically unique haploid cells.", isTrue: true, hint: "Meiosis makes gametes.", subject: "biology" },
  { id: "tf9", statement: "Carbon has an atomic number of 6.", isTrue: true, hint: "C is element 6.", subject: "chemistry" },
  { id: "tf10", statement: "Noble gases readily form chemical bonds.", isTrue: false, hint: "Noble gases have full outer shells.", subject: "chemistry" },
  { id: "tf11", statement: "NaCl is an ionic compound.", isTrue: true, hint: "Sodium chloride forms ions in solution.", subject: "chemistry" },
  { id: "tf12", statement: "pH 7 is neutral on the pH scale.", isTrue: true, hint: "Pure water is pH 7.", subject: "chemistry" },
  { id: "tf13", statement: "A catalyst speeds up a chemical reaction without being consumed.", isTrue: true, hint: "Enzymes are biological catalysts.", subject: "chemistry" },
  { id: "tf14", statement: "Oxygen gas is diatomic (O₂).", isTrue: true, hint: "Most common form of oxygen is O₂.", subject: "chemistry" },
  { id: "tf15", statement: "Acids have a pH greater than 7.", isTrue: false, hint: "Acids have pH below 7.", subject: "chemistry" },
  { id: "tf16", statement: "Force equals mass times acceleration (F = ma).", isTrue: true, hint: "Newton's second law.", subject: "physics" },
  { id: "tf17", statement: "Sound travels faster in air than in steel.", isTrue: false, hint: "Sound is faster in denser media.", subject: "physics" },
  { id: "tf18", statement: "Light travels in a straight line in a uniform medium.", isTrue: true, hint: "Rectilinear propagation.", subject: "physics" },
  { id: "tf19", statement: "Gravity on the Moon is stronger than on Earth.", isTrue: false, hint: "Moon gravity is about 1/6 of Earth's.", subject: "physics" },
  { id: "tf20", statement: "Energy cannot be created or destroyed, only transformed.", isTrue: true, hint: "Law of conservation of energy.", subject: "physics" },
  { id: "tf21", statement: "Voltage is measured in amperes.", isTrue: false, hint: "Voltage is in volts; current is amperes.", subject: "physics" },
  { id: "tf22", statement: "Friction always opposes motion.", isTrue: true, hint: "Friction acts against the direction of motion.", subject: "physics" },
  { id: "tf23", statement: "Helium is a noble gas.", isTrue: true, hint: "He is in group 18.", subject: "chemistry" },
  { id: "tf24", statement: "Protons carry a negative charge.", isTrue: false, hint: "Protons are positive; electrons are negative.", subject: "physics" },
];

export const MOLECULES = [
  { id: "m1", formula: "H₂O", name: "Water" },
  { id: "m2", formula: "CO₂", name: "Carbon dioxide" },
  { id: "m3", formula: "NaCl", name: "Salt" },
  { id: "m4", formula: "O₂", name: "Oxygen" },
  { id: "m5", formula: "CH₄", name: "Methane" },
  { id: "m6", formula: "NH₃", name: "Ammonia" },
  { id: "m7", formula: "HCl", name: "Hydrochloric acid" },
  { id: "m8", formula: "C₆H₁₂O₆", name: "Glucose" },
];

export const CELL_PARTS = [
  { id: "nucleus", name: "Nucleus", plantOnly: false },
  { id: "mitochondria", name: "Mitochondria", plantOnly: false },
  { id: "ribosome", name: "Ribosome", plantOnly: false },
  { id: "membrane", name: "Cell Membrane", plantOnly: false },
  { id: "chloroplast", name: "Chloroplast", plantOnly: true },
  { id: "vacuole", name: "Vacuole", plantOnly: true },
  { id: "wall", name: "Cell Wall", plantOnly: true },
];
