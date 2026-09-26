# Science Bowl Coach — web

Full-parity web port of the Mac/iPhone SwiftUI app in `../ScienceBowlCoach`.

Middle School only. No account required. Progress stays in this browser unless you export a backup.

The Mac app is unchanged. This folder is a new Next.js / Vercel project.

## Local

```bash
cd /Users/farah/Documents/FarahRasheed/ScienceBowlCoachWeb
npm install
npm run dev
```

Open http://localhost:3000

## GitHub

This folder is ready for you to attach a repo. From here:

```bash
cd /Users/farah/Documents/FarahRasheed/ScienceBowlCoachWeb
git init
git add .
git commit -m "Initial web port of Science Bowl Coach"
gh repo create SohaScienceBowlWeb --public --source=. --remote=origin --push
```

Use any repo name you want.

## Vercel

Same flow as Sunday School Attendance:

```bash
npx vercel
npx vercel --prod
```

Hobby / free tier is enough. No database is required. Optional later: add `DATABASE_URL` if you want a shared buzzer room that survives serverless instances.

## Data

Copied from the Mac app:

- 125 encyclopedia topics
- encyclopedia + Hewitt Ch 17 questions
- 50 summer study blocks
- 11 Texas Regional Sprint packs
- 114 POT 6 topics + catch-up list
- DOE starter question cache
- calendar / timetable / periodic table HTML

To refresh extracted Swift catalogs after Mac-app edits:

```bash
npm run extract
```

To load the full DOE bank the Mac app parsed, export `doe_questions_cache.json` from the Mac Documents folder and import it in Settings.

## Tabs (same as Mac)

Today · Weeks · Calendar · Topics · Learn · Elements · MathCounts · POT 6 · POT 6 Geo · Mental Math · Games · Quiz · Progress · Settings
