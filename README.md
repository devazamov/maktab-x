# MAKTAB X

Telegram Mini App + AI Education & School Safety ecosystem.

This repo is a **new, standalone project** — separate from the existing
`maktab-x-1-school` Express app. It talks to the same Supabase account,
but as its own project/schema, using the stack the brief specifies:
Next.js (App Router) + TypeScript + Tailwind + Supabase + Telegraf +
Gemini (Phase 3+), deployed on Vercel.

## What's built (Phase 1)

Per the phased plan in the spec (section 47), this first pass covers:

- ✅ Project architecture & tech setup
- ✅ Database schema (Supabase/Postgres) — Phase 1 tables live, later
  phases' tables laid out ahead of time so future migrations don't
  reshape existing data (see comments in `database/schema.sql`)
- ✅ Telegram Bot foundation — `/start` with a Mini App launch button,
  webhook route, secret-token verification
- ✅ Telegram Mini App foundation — WebApp SDK wired in, theme-ready
- ✅ Authentication — server-side `initData` HMAC validation (the real
  Telegram algorithm, not a stub), user upsert, signed session cookie
- ✅ Student Home — greeting, level/XP progress, streak, quick-actions
  grid, daily quests — reads from `/api/me`, which reads real Supabase
  data once a session + Supabase are configured
- ✅ UI component system — Button, Card, ProgressBar, Badge, BottomNav,
  all built on the brief's color tokens (`tailwind.config.ts`)

Every other quick-action (Quiz, 1v1 Battle, AI Crossword, AI Teacher,
Fanlar, Liga, Sinfim, Xavfsizlik) is visibly present but shows an
honest "tez orada" (coming soon) toast instead of pretending to work —
no fake buttons or fake APIs, as the spec asks.

**Not built yet:** everything from Phase 2 onward (quizzes, battles,
class/school league, crossword, AI teacher, QR classroom, safety
center, teacher/parent/admin dashboards). The schema anticipates them;
the app code doesn't implement them yet.

## Project structure

```
/app                Next.js App Router pages + API routes
  /api/auth/telegram   POST — validates initData, creates session
  /api/me              GET  — Student Home data (real or demo fallback)
  /api/bot/webhook     POST — Telegram bot webhook
/components/ui       Design-system primitives
/features/home        Student Home screen
/lib                  telegram.ts (initData validation), supabase.ts,
                       session.ts, utils.ts
/services              bot.ts (Telegraf bot definition)
/hooks                 useTelegram (WebApp SDK access)
/types                 Shared TS types
/database              schema.sql, seed.ts
```

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project (or reuse your existing account — this can be a
   new project inside it).
2. Run `database/schema.sql` in the SQL editor.
3. Copy the project URL, anon key, and service role key into
   `.env.local`.
4. Optionally seed demo data: `npm run seed` (needs the service role
   key in `.env.local` — creates a demo school, 6 classes, 12
   subjects, and a demo student "Zarifjon").

### 3. Telegram bot

1. Create a bot with [@BotFather](https://t.me/BotFather), grab the
   token → `TELEGRAM_BOT_TOKEN`.
2. `/setmenubutton` or just rely on `/start`'s inline button — both
   open the Mini App at `NEXT_PUBLIC_APP_URL`.
3. Pick a random `TELEGRAM_WEBHOOK_SECRET`.
4. After deploying (step 4), register the webhook:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/bot/webhook&secret_token=<WEBHOOK_SECRET>"
   ```

### 4. Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel, add all `.env.example` vars as project env
   vars.
3. Set `NEXT_PUBLIC_APP_URL` to the Vercel URL once you have it (a
   redeploy is needed after setting it, since the bot's button reads
   it at build/runtime).
4. Register the Telegram webhook (step 3.4 above) once live.

### 5. Local dev

```bash
npm run dev
```

Opening `localhost:3000` directly in a browser (outside Telegram)
still renders — `useTelegram` detects there's no `window.Telegram`
and `/api/me` serves the demo payload, so you can iterate on UI
without a live bot.

## Notes for the next phase

- `database/schema.sql` already has tables for quizzes, battles,
  crosswords, achievements, safety reports, etc. — RLS is enabled and
  locked to the service role on all of them until each feature defines
  real policies.
- `services/bot.ts` only handles `/start`. Phase 3+ (AI Teacher) will
  likely add more bot commands here, or keep everything in the Mini
  App and leave the bot as a thin launcher — worth deciding before
  that phase starts.
- The Gemini integration point (`AIService` abstraction, section 40 of
  the spec) isn't created yet — add it under `/services/ai/` when
  Phase 3 starts, so swapping providers later stays a one-file change.
