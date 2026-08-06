-- Batches, Form Links, and Digital Agreements
-- Run in the Supabase SQL Editor (or via CLI migration).

-- ---------------------------------------------------------------------------
-- 1. Batch column on profiles (student's batch: Batch 1..6)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists batch text;

-- ---------------------------------------------------------------------------
-- 2. Batch column on class_sessions — which batch this live class is for
-- ---------------------------------------------------------------------------
alter table public.class_sessions add column if not exists batch text;

-- ---------------------------------------------------------------------------
-- 3. Batch column on videos — null means visible to ALL batches (legacy).
--    A non-null batch restricts the video to students in that batch only.
-- ---------------------------------------------------------------------------
alter table public.videos add column if not exists batch text;

create index if not exists videos_batch_idx on public.videos (batch);
create index if not exists class_sessions_batch_idx on public.class_sessions (batch);

-- ---------------------------------------------------------------------------
-- 4. form_links — admin-built forms; each generates a shareable link
--    fields is a JSON array of field definitions, e.g.
--    [{"key":"name","label":"Full Name","type":"text","required":true},
--     {"key":"email","label":"Email","type":"email","required":true},
--     {"key":"batch","label":"Batch","type":"select","options":["Batch 1","Batch 2"],"required":true},
--     {"key":"message","label":"Message","type":"textarea","required":false}]
-- ---------------------------------------------------------------------------
create table if not exists public.form_links (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,               -- display name shown in admin
  slug        text not null unique,        -- URL slug for the public link
  fields      jsonb not null default '[]'::jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists form_links_slug_idx on public.form_links (slug);

-- ---------------------------------------------------------------------------
-- 5. form_submissions — one row per response to a form link
--    data is a JSON object keyed by the field keys defined on the form.
-- ---------------------------------------------------------------------------
create table if not exists public.form_submissions (
  id          uuid primary key default gen_random_uuid(),
  form_id     uuid not null references public.form_links (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists form_submissions_form_idx on public.form_submissions (form_id);

-- ---------------------------------------------------------------------------
-- 6. agreements — digital consent from students (no video sharing, no refund,
--    etc.). Holds a webcam selfie, an on-screen signature, and contact/legal
--    details. Images live in the private 'agreements' storage bucket.
-- ---------------------------------------------------------------------------
create table if not exists public.agreements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  email          text not null,
  name           text,
  address        text,
  phone          text,
  signature_path text,
  selfie_path    text,
  agreement_text text,
  agreed_at      timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (user_id)
);

create index if not exists agreements_email_idx on public.agreements (email);

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.form_links enable row level security;
alter table public.form_submissions enable row level security;
alter table public.agreements enable row level security;

-- Form links & submissions: admin-only (all writes go through the server API).
drop policy if exists "form_links_admin_all" on public.form_links;
create policy "form_links_admin_all"
  on public.form_links for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "form_submissions_admin_all" on public.form_submissions;
create policy "form_submissions_admin_all"
  on public.form_submissions for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Agreements: a student may read their own; admins read all.
drop policy if exists "agreements_select_own_or_admin" on public.agreements;
create policy "agreements_select_own_or_admin"
  on public.agreements for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- 8. Private storage bucket for agreement images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agreements',
  'agreements',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- No storage policies for anon/authenticated: all uploads and reads happen
-- server-side with the service role key (which bypasses RLS).
