-- ─── SUPABASE DATABASE SCHEMA FOR PRIME STRIKE ───

-- 1. Create Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Events Table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  date date not null,
  time text not null,
  link text,
  location text default 'Online Webinar',
  category text default 'Webinar',
  created_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.events enable row level security;
-- 4. RLS Policies for Profiles
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can read all profiles" on public.profiles
  for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 5. RLS Policies for Events
create policy "Allow public read access to events" on public.events
  for select using (true);

create policy "Only admins can insert events" on public.events
  for insert with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Only admins can update events" on public.events
  for update using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Only admins can delete events" on public.events
  for delete using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 6. Trigger Function to Automatically Create Profile Row on Auth SignUp
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Seed Data for Upcoming Events (relative to July/August 2026)
insert into public.events (title, description, date, time, link, location, category)
values 
  (
    'Options Buying & Hedging Masterclass',
    'Learn how to manage risk, perform option chain analysis, and implement key options strategies under founder Saranya.',
    '2026-08-10',
    '10:00 AM - 12:30 PM',
    'https://zoom.us/j/123456789',
    'Online Webinar',
    'Options Course'
  ),
  (
    'Price Action Breakthrough Setup',
    'Advanced Price Action Bootcamp focusing on identifying strong support and resistance breakout zones with volume confirmation.',
    '2026-08-24',
    '02:00 PM - 04:30 PM',
    'https://zoom.us/j/987654321',
    'Online Webinar',
    'Technical Analysis'
  ),
  (
    'Trading Psychology and Risk Metrics',
    'Learn critical guidelines on position sizing, leverage management, and training your mind to accept losses.',
    '2026-09-05',
    '11:00 AM - 01:30 PM',
    'https://zoom.us/j/555666777',
    'Nungambakkam Center & Online',
    'Psychology'
  );

-- 8. Create Leads Table for Joined Course & Enquiries Form
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text not null,
  experience text,
  joined_course text default 'Basic to Advance',
  first_class_date text,
  paid_amount text,
  goal text,
  capital text,
  notes text,
  status text not null default 'new' check (status in ('new', 'contacted', 'joined', 'ignored')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure new columns exist on existing tables
alter table public.leads add column if not exists joined_course text;
alter table public.leads add column if not exists first_class_date text;
alter table public.leads add column if not exists paid_amount text;

-- Enable RLS on Leads table
alter table public.leads enable row level security;

-- RLS Policies for Leads table
create policy "Allow public to insert leads" on public.leads
  for insert with check (true);

create policy "Only admins can select leads" on public.leads
  for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Only admins can update leads" on public.leads
  for update using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Only admins can delete leads" on public.leads
  for delete using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 9. Live Classes (Zoom) — see supabase/migrations/live_classes.sql for the full migration
create table if not exists public.class_sessions (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  starts_at        timestamptz not null,
  duration_minutes integer not null default 120,
  zoom_meeting_id  text,
  zoom_start_url   text,
  zoom_join_url    text,
  created_at       timestamptz not null default now()
);

create table if not exists public.class_session_registrants (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.class_sessions (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  email         text not null,
  name          text,
  registrant_id text,
  join_url      text,
  status        text not null default 'pending',
  created_at    timestamptz not null default now(),
  unique (session_id, user_id)
);

