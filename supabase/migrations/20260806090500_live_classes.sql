-- Live Classes (Zoom) — per-student personalized join links.
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- It only creates NEW tables; nothing existing is touched.

-- ---------------------------------------------------------------------------
-- 1. class_sessions — one row per scheduled live class
--    zoom_meeting_id is the Zoom meeting created by the server via the API.
-- ---------------------------------------------------------------------------
create table if not exists public.class_sessions (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  description        text,
  starts_at          timestamptz not null,
  duration_minutes   integer not null default 120,
  zoom_meeting_id    text,
  zoom_start_url     text,   -- host "start meeting" link (server/admin only)
  zoom_join_url      text,   -- generic join link (fallback)
  created_at         timestamptz not null default now()
);

create index if not exists class_sessions_starts_at_idx on public.class_sessions (starts_at);

-- ---------------------------------------------------------------------------
-- 2. class_session_registrants — per-student registration for a session.
--    join_url is the STUDENT'S PERSONAL link returned by Zoom. It is unique
--    per student, so sharing it is attributable back to the student.
-- ---------------------------------------------------------------------------
create table if not exists public.class_session_registrants (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.class_sessions (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  email           text not null,
  name            text,
  registrant_id   text,
  join_url        text,
  status          text not null default 'pending',
  created_at      timestamptz not null default now(),
  unique (session_id, user_id)
);

create index if not exists class_session_registrants_session_idx
  on public.class_session_registrants (session_id);
create index if not exists class_session_registrants_user_idx
  on public.class_session_registrants (user_id);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.class_sessions enable row level security;
alter table public.class_session_registrants enable row level security;

-- Any logged-in user (student) can view session details.
drop policy if exists "class_sessions_select_policy" on public.class_sessions;
create policy "class_sessions_select_policy"
  on public.class_sessions for select
  to authenticated
  using (true);

-- Students can read their own registration row; admins can read all.
drop policy if exists "class_session_registrants_select_policy" on public.class_session_registrants;
create policy "class_session_registrants_select_policy"
  on public.class_session_registrants for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Make the script re-runnable (matches the repo's other migrations).

-- All writes go through the server API routes (service role), so no insert /
-- update / delete policies are granted to clients. This keeps personal join
-- links private — they can only ever be read server-side.
