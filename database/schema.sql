-- MAKTAB X — database schema (Supabase / Postgres)
--
-- Phase 1 tables (users, schools, classes, student_profiles) are the
-- ones the current codebase actually reads/writes. Everything below
-- the "FUTURE PHASES" marker is schema laid out ahead of time per the
-- spec's model list (section 31) so later phases don't need
-- migrations that reshape Phase 1 tables — but no app code touches
-- them yet. RLS is enabled everywhere; policies are intentionally
-- strict (service-role only) until each phase wires up real access
-- rules, so nothing is accidentally left world-readable.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- PHASE 1: identity, schools, classes, student progress
-- ---------------------------------------------------------------

create type user_role as enum (
  'STUDENT',
  'TEACHER',
  'PARENT',
  'PSYCHOLOGIST',
  'SAFETY_OFFICER',
  'SCHOOL_ADMIN',
  'SUPER_ADMIN'
);

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  district text,
  address text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null, -- e.g. "11-A"
  grade int not null,
  homeroom_teacher_id uuid, -- fk added after `users` exists
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  first_name text not null,
  last_name text,
  username text,
  language_code text,
  role user_role not null default 'STUDENT',
  school_id uuid references schools(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table classes
  add constraint classes_homeroom_teacher_fk
  foreign key (homeroom_teacher_id) references users(id) on delete set null;

create table if not exists student_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  level int not null default 1,
  xp int not null default 0,
  xp_to_next_level int not null default 100,
  streak_days int not null default 0,
  last_activity_at timestamptz
);

create table if not exists teacher_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  subject text
);

create table if not exists parent_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  student_id uuid references users(id) on delete set null
);

create table if not exists xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount int not null,
  reason text not null, -- 'QUIZ' | 'BATTLE' | 'CROSSWORD' | 'QUEST' | 'LESSON' | 'EVENT'
  reference_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  xp_reward int not null,
  active_on date not null default current_date
);

create table if not exists quest_completions (
  quest_id uuid not null references quests(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (quest_id, user_id)
);

-- ---------------------------------------------------------------
-- FUTURE PHASES — laid out now, not yet used by app code
-- ---------------------------------------------------------------

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id),
  grade int,
  difficulty text, -- 'OSON' | 'ORTA' | 'QIYIN'
  prompt text not null,
  options jsonb not null, -- ["A text", "B text", "C text", "D text"]
  correct_index int not null,
  explanation text,
  source text default 'MANUAL', -- 'MANUAL' | 'AI_GENERATED'
  created_at timestamptz not null default now()
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id),
  created_by uuid references users(id),
  difficulty text,
  question_count int not null,
  created_at timestamptz not null default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  score int,
  correct_count int,
  wrong_count int,
  time_seconds int,
  xp_awarded int,
  completed_at timestamptz
);

create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id),
  question_count int not null,
  status text not null default 'WAITING', -- WAITING | READY | LIVE | FINISHED
  created_at timestamptz not null default now()
);

create table if not exists battle_participants (
  battle_id uuid not null references battles(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  score int default 0,
  rating_delta int default 0,
  is_winner boolean,
  primary key (battle_id, user_id)
);

create table if not exists crosswords (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id),
  topic text not null,
  grid jsonb not null,
  clues jsonb not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- 'BRAIN_MASTER', 'FAST_SOLVER', ...
  title text not null,
  icon text
);

create table if not exists user_achievements (
  user_id uuid not null references users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id),
  name text not null,
  description text,
  starts_at timestamptz,
  location text,
  created_by uuid references users(id)
);

create table if not exists event_participants (
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  primary key (event_id, user_id)
);

create table if not exists safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references users(id), -- null when anonymous
  is_anonymous boolean not null default false,
  category text not null,
  description text not null,
  location text,
  status text not null default 'NEW', -- NEW | ASSIGNED | REVIEWING | ACTION_TAKEN | CLOSED
  assigned_to uuid references users(id),
  ai_priority text,
  created_at timestamptz not null default now()
);

create table if not exists safety_lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text,
  content text,
  quiz_id uuid references quizzes(id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists qr_resources (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'CLASSROOM' | 'SCHOOL'
  class_id uuid references classes(id),
  school_id uuid references schools(id),
  code text not null unique
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id),
  title text not null,
  body text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Row Level Security — locked to service role until each phase
-- defines its own policies. The app talks to Supabase exclusively
-- through the service-role key from server-side API routes, so this
-- is safe by default and deliberately not readable by the anon key.
-- ---------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;
