-- Video access system: catalog + per-student access requests.
-- Run in Supabase SQL editor (or via CLI migration).
--
-- Supersedes the anonymous one-time `video_grants` token flow with a
-- login-gated request/grant model:
--   student logs in -> requests a catalog video -> admin grants ->
--   student watches in-app for 48h -> access auto-expires.

-- ---------------------------------------------------------------------------
-- 1. Catalog of videos students may request.
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  storage_path  text not null,            -- object path inside the private bucket
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Per-student access requests / grants.
-- ---------------------------------------------------------------------------
create table if not exists public.video_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  email        text not null,
  video_id     uuid not null references public.videos (id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'granted', 'denied')),
  granted_at   timestamptz,
  expires_at   timestamptz,               -- granted_at + 48h, set on grant
  created_at    timestamptz not null default now(),
  request_count integer not null default 1,
  grant_count   integer not null default 0,
  view_count    integer not null default 0,
  -- One live request per student per video (re-request after deny/expiry
  -- is handled in the API by updating the existing row).
  unique (user_id, video_id)
);

-- Ensure columns exist if table was already created
alter table public.video_requests add column if not exists request_count integer not null default 1;
alter table public.video_requests add column if not exists grant_count integer not null default 0;
alter table public.video_requests add column if not exists view_count integer not null default 0;

create index if not exists video_requests_user_idx   on public.video_requests (user_id);
create index if not exists video_requests_status_idx on public.video_requests (status);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security.
-- ---------------------------------------------------------------------------
alter table public.videos          enable row level security;
alter table public.video_requests  enable row level security;

-- Catalog: any authenticated user can read ACTIVE videos. Writes are
-- service-role only (admin API), which bypasses RLS.
drop policy if exists "videos_read_active" on public.videos;
create policy "videos_read_active"
  on public.videos for select
  to authenticated
  using (active = true);

-- Requests: a student may read their own rows.
drop policy if exists "requests_read_own" on public.video_requests;
create policy "requests_read_own"
  on public.video_requests for select
  to authenticated
  using (auth.uid() = user_id);

-- Requests: a student may create a request for themselves, always as 'pending'.
drop policy if exists "requests_insert_own" on public.video_requests;
create policy "requests_insert_own"
  on public.video_requests for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'pending');

-- NOTE: no UPDATE/DELETE policy for students. Granting, denying, and setting
-- expiry are done by the server with the service-role key (bypasses RLS).
