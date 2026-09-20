# MAKTAB X

Telegram Mini App + AI Education & School Safety ecosystem.

This repo is a **new, standalone project** — separate from the existing
`maktab-x-1-school` Express app. It talks to the same Supabase account,
but as its own project/schema, using the stack the brief specifies:
Next.js (App Router) + TypeScript + Tailwind + Supabase + Telegraf +
Gemini (Phase 3+), deployed on Vercel.

## What's built

Phase 1 (project foundation, auth, Student Home) plus a first slice of
Phase 2/7 pulled forward by request:

- ✅ Project architecture & tech setup
- ✅ Database schema (Supabase/Postgres)
- ✅ Telegram Bot foundation — `/start`, webhook, secret-token check
- ✅ Telegram Mini App foundation — WebApp SDK wired in
- ✅ Authentication — real `initData` HMAC validation, session cookie
- ✅ Student Home — level/XP, streak, quick-actions, daily quests
- ✅ UI component system
- ✅ **Bot registration flow** — on first `/start`, a user not yet
  assigned to a class is asked "O'quvchiman / O'qituvchiman", then
  picks their class from the real `classes` table for the resolved
  school (`SCHOOL_ID` env, or the only school if there's just one).
  Students get `student_profiles.class_id` set; the first teacher to
  claim a class becomes its `homeroom_teacher_id`. Already-registered
  users (and admins) skip straight to the normal welcome message.
- ✅ **QR classroom page** (`/classroom/[id]`) — public, read-only,
  shows the school/class name, student *count* (never individual
  student names — per the spec's own privacy rule), and homeroom
  teacher. You generate/print the QR codes yourselves, each one
  encoding `https://maktab-x.onrender.com/classroom/<class_id>`.
- ✅ **In-Mini-App QR scanner** (`/scan`) — the bot's "📷 QR
  skanerlash" button opens this; it reads the camera with `jsQR` and
  jumps straight to `/classroom/<id>` when it recognizes a MAKTAB X
  QR, or just shows the raw decoded text otherwise.

Every other quick-action (Quiz, 1v1 Battle, AI Crossword, AI Teacher,
Fanlar, Liga, Xavfsizlik) still shows an honest "tez orada" toast.

## Queued next (not built yet)

- Voice AI teacher / pronunciation checker (needs `GEMINI_API_KEY` +
  a speech pipeline — not wired up yet)
- Missions + Telegram sticker rewards (needs real sticker artwork
  turned into an actual Telegram sticker pack via @Stickers first —
  code can't fabricate that art)
- Friend-referral XP bonus
- "Glow" visual pass over the Phase 1 screens (brighter card glow,
  glassmorphism, XP-gain glow pulse)
- Admin panel (class management, sticker management) — right now
  classes are managed directly in Supabase; there's no in-app admin
  UI yet

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
