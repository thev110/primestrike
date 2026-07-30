-- Daily Homework Submission & Supabase Storage System
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ---------------------------------------------------------------------------
-- 1. Create homework_submissions table
-- ---------------------------------------------------------------------------
create table if not exists public.homework_submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  user_email       text,
  user_name        text,
  submission_date  date not null,
  file_path        text not null,
  file_name        text not null,
  file_type        text not null,
  file_size        bigint not null default 0,
  notes            text,
  status           text not null default 'submitted' check (status in ('submitted', 'reviewed', 'resubmitted')),
  mentor_feedback  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, submission_date)
);

-- Ensure columns exist if table was partially created
alter table public.homework_submissions add column if not exists user_email text;
alter table public.homework_submissions add column if not exists user_name text;
alter table public.homework_submissions add column if not exists mentor_feedback text;
alter table public.homework_submissions add column if not exists status text not null default 'submitted';

create index if not exists homework_submissions_user_idx on public.homework_submissions (user_id);
create index if not exists homework_submissions_date_idx on public.homework_submissions (submission_date);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security (RLS) for homework_submissions table
-- ---------------------------------------------------------------------------
alter table public.homework_submissions enable row level security;

-- Students can read their own submissions, admins can read all
drop policy if exists "homework_select_policy" on public.homework_submissions;
create policy "homework_select_policy"
  on public.homework_submissions for select
  to authenticated
  using (
    auth.uid() = user_id 
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Students can insert their own daily submission
drop policy if exists "homework_insert_policy" on public.homework_submissions;
create policy "homework_insert_policy"
  on public.homework_submissions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Students can update their own submission (or admins updating status/feedback)
drop policy if exists "homework_update_policy" on public.homework_submissions;
create policy "homework_update_policy"
  on public.homework_submissions for update
  to authenticated
  using (
    auth.uid() = user_id 
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Students can delete their own submission
drop policy if exists "homework_delete_policy" on public.homework_submissions;
create policy "homework_delete_policy"
  on public.homework_submissions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Private Storage Bucket for Homework Files
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homework-submissions',
  'homework-submissions',
  false,
  20971520, -- 20 MB limit
  array[
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = array[
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp'
  ];

-- Storage RLS Policies
drop policy if exists "Students can upload homework to their folder" on storage.objects;
create policy "Students can upload homework to their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'homework-submissions' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Students can read their own homework and admins can read all" on storage.objects;
create policy "Students can read their own homework and admins can read all"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'homework-submissions' 
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles 
        where id = auth.uid() and role = 'admin'
      )
    )
  );

drop policy if exists "Students can update their own homework files" on storage.objects;
create policy "Students can update their own homework files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'homework-submissions' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Students can delete their own homework files" on storage.objects;
create policy "Students can delete their own homework files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'homework-submissions' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );
