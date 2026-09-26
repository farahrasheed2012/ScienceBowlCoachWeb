import Link from "next/link";

const GAMES = [
  { id: "wordle", title: "Science Wordle", subtitle: "Guess the 5-letter science term" },
  { id: "truefalse", title: "True or False Blitz", subtitle: "Rapid true/false fact checks" },
  { id: "elements", title: "Element Blitz", subtitle: "90-second element sprint" },
  { id: "molecules", title: "Molecule Match", subtitle: "Flip cards — formula ↔ name" },
  { id: "cell", title: "Cell Builder", subtitle: "Place organelles in the right cell" },
];

export default function GamesPage() {
  return (
    <div>
      <h1>Mini-Games</h1>
      <p className="muted">Quick science breaks — 1 to 5 minutes each.</p>
      <div className="grid two">
        {GAMES.map((game) => (
          <Link className="card" key={game.id} href={`/games/${game.id}`}>
            <h3>{game.title}</h3>
            <p className="muted">{game.subtitle}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
