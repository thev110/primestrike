-- Student Catalogue — admin-maintained directory of students with phone
-- numbers, group/batch, payment info and notes.
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- It only creates NEW tables; nothing existing is touched.

create table if not exists public.student_catalogue (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text,
  group_name    text,              -- e.g. "Batch 3" / "Group A"
  fee_amount    numeric default 0, -- total course fee (₹)
  amount_paid   numeric default 0, -- amount already paid (₹)
  notes         text,              -- messages / what they sent / remarks
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists student_catalogue_group_idx
  on public.student_catalogue (group_name);

-- Auto-update updated_at on changes.
create or replace function public.touch_student_catalogue()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists student_catalogue_touch on public.student_catalogue;
create trigger student_catalogue_touch
  before update on public.student_catalogue
  for each row execute procedure public.touch_student_catalogue();

-- ─── Row Level Security: only admins can read/write ──────────────
alter table public.student_catalogue enable row level security;

drop policy if exists "student_catalogue_admin_select" on public.student_catalogue;
create policy "student_catalogue_admin_select"
  on public.student_catalogue for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "student_catalogue_admin_insert" on public.student_catalogue;
create policy "student_catalogue_admin_insert"
  on public.student_catalogue for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "student_catalogue_admin_update" on public.student_catalogue;
create policy "student_catalogue_admin_update"
  on public.student_catalogue for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "student_catalogue_admin_delete" on public.student_catalogue;
create policy "student_catalogue_admin_delete"
  on public.student_catalogue for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
