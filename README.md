# Science Bowl Coach — web

Middle School Science Bowl study site, ported from the Mac/iPhone app in `../ScienceBowlCoach`. The Mac app is unchanged.

No account. Progress stays in this browser unless you export a backup. MathCounts, POT 6, and Games stay on the Mac only.

After August 28, Home is school-year keep-sharp: weak spots, a weekday toss-up, regional sprint, flashcards. The 12-week summer blocks live under Weeks as an archive. Thursday and Friday fill Earth & Energy, which the summer pass skipped.

## Local

```bash
cd /Users/farah/Documents/FarahRasheed/ScienceBowlCoachWeb
npm install
npm run dev
```

Open http://localhost:3000

## GitHub

Private repo: [farahrasheed2012/ScienceBowlCoachWeb](https://github.com/farahrasheed2012/ScienceBowlCoachWeb)

## Vercel

Same flow as Sunday School Attendance:

```bash
npx vercel
npx vercel --prod
```

Hobby / free tier is enough. No database is required. Optional later: add `DATABASE_URL` if you want a shared buzzer room that survives serverless instances.

## Data

Copied from the Mac app:

- 125 encyclopedia topics with assigned readings (`topic_readings.json`)
- encyclopedia + Hewitt Ch 17 questions
- 50 summer study blocks (archive after Aug 28)
- 11 Texas Regional Sprint packs
- 634 TossUp bundled questions (bio, chem, math)
- DOE starter question cache
- calendar / timetable / periodic table HTML

To refresh extracted Swift catalogs after Mac-app edits:

```bash
npm run extract
```

To load the full DOE bank the Mac app parsed, export `doe_questions_cache.json` from the Mac Documents folder and import it on Practice or in Settings. Earth and Energy get much thicker with a real cache.

Coach notes on each question work offline from the encyclopedia. Optional richer AI: set `GROQ_API_KEY` or `OPENAI_API_KEY` in `.env.local`.

## Tabs

Home · Practice · Learn · Progress · Settings

- **Home** — school-year plan (or summer 1-hour blocks before Aug 28)
- **Practice** — TossUp bank + encyclopedia + curriculum + imported DOE. Official 5s MC / 20s SA.
- **Learn** — encyclopedia, Review with books, Formulas, flashcards, Topics, Weeks archive
- **Review** (`/learn/review`) — weak topics first, then unreviewed Earth/Energy, with textbook/chapter/page lines from the catalog. Open the assigned section, then drill. Not a new chapter hour.

Textbooks are a lookup tool. The site does not rebuild the Mac FLS/Hewitt chapter-checkbox grid.
