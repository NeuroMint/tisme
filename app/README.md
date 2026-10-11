# Tisme App

A private, single-user web app for recording Graham's autobiography:
guided interview questions, type-or-record answers, optional AI
transcription and narrative polishing, photos, a timeline, and a one-click
export to a manuscript.

## Run it

```bash
npm install
cp .env.example .env   # fill in API keys below if you have them
npx prisma migrate dev # creates/updates the local SQLite database
npm run db:seed        # loads chapters + starter interview questions
npm run dev
```

Open http://localhost:3000.

## Optional AI features

Both are optional — the app works fully without either, just with fewer
automated steps:

- **`OPENAI_API_KEY`** — audio answers are automatically transcribed
  (Whisper). Without it, you can type the transcript in yourself after
  recording.
- **`ANTHROPIC_API_KEY`** — raw answers/transcripts are polished into clean
  first-person narrative prose for the manuscript. Without it, the raw text
  is used as-is (you can still edit it by hand, or hit "Polish with AI"
  later once a key is added).

## How it's organised

- `prisma/schema.prisma` — Chapters (seeded from `../docs/chapter-outline.md`),
  Questions (seeded from `../docs/interview-guide.md`), Entries (one per
  answer — typed or recorded), MediaFile (photos attached to entries).
- `prisma/seed.ts` — the chapter/question seed data. Edit here if the
  chapter structure changes.
- `lib/ai.ts` — the two optional AI calls, both designed to fail soft.
- `lib/storage.ts` — saves uploaded audio/photos under `storage/uploads/`
  (not committed to git — these are Graham's private files).
- `app/` — dashboard (`/`), chapter view (`/chapters/[id]`), `/timeline`,
  `/export`.

## Export

`/export` compiles every recorded entry into one manuscript, grouped by
part and chapter per `docs/chapter-outline.md`, and saves a copy to
`../archive/02-autobiography-draft/manuscript.md` each time.

## Status

Single-user pilot (no login/accounts) — this is intentional for now, see
the repo root `docs/roadmap.md`. Multi-user/accounts would be Phase 6+ work
if the pilot leads to building the wider platform.
