# Science Bowl Coach — web

Middle School Science Bowl study site, ported from the Mac/iPhone app in `../ScienceBowlCoach`. The Mac app is unchanged.

No account. Progress stays in this browser. Add a kid in Settings — that creates their locker. The same name on the phone picks it up. MathCounts, POT 6, and Games stay on the Mac only.

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

Hobby / free tier is enough. For phone ↔ Mac sync, create a **new** Neon project (do not reuse Sunday School Attendance) and set that `DATABASE_URL` in `.env.local` and in Vercel. The app creates table `sbc_web_progress` only. Export/import still works without a database.

## Data

Copied from the Mac app:

- 125 encyclopedia topics with assigned readings (`topic_readings.json`)
- encyclopedia + Hewitt Ch 17 questions
- 50 summer study blocks (archive after Aug 28)
- 11 Texas Regional Sprint packs
- 634 TossUp bundled questions (bio, chem, math)
- Official DOE middle-school sample sets 1–16 plus Round Robin / Double Elim extras (`doe_questions_cache.json`, ~11,300 questions). Physical Science is split into Chemistry vs Physics for practice.
- calendar / timetable / periodic table HTML
- Soha Python Coach lessons (`python_coach.json`) — read on iPhone, run on the Mac app

To refresh extracted Swift catalogs after Mac-app edits:

```bash
npm run extract
```

Refresh the official DOE bank (downloads public MS PDFs, no invented questions):

```bash
python3 -m pip install pypdf
python3 scripts/build_doe_ms_cache.py
```

Practice or Settings can still import another cache if you have a newer file.

Coach notes on each question work offline from the encyclopedia. Optional richer AI (free tier): set `GROQ_API_KEY` in `.env.local` and in Vercel. OpenAI is not used.

## Tabs

Home · Practice · Learn · Progress · Settings

- **Home** — school-year plan (or summer 1-hour blocks before Aug 28)
- **Practice** — TossUp bank + encyclopedia + curriculum + imported DOE. Official 5s MC / 20s SA.
- **Learn** — Science Bowl encyclopedia, Python Coach, flashcards, books, Topics, Weeks archive
- **Python Coach** (`/python`) — 50-week path under Learn. Read on the phone; Run stays on the Mac app
- **Review** (`/learn/review`) — weak topics first, then unreviewed Earth/Energy, with textbook/chapter/page lines from the catalog. Open the assigned section, then drill. Not a new chapter hour.

Textbooks are a lookup tool. The site does not rebuild the Mac FLS/Hewitt chapter-checkbox grid.
