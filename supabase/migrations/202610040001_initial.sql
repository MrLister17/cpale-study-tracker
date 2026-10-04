-- CPALE Study Tracker beta schema. All user content is private by default.
create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;

create table if not exists internal.app_config (
  singleton boolean primary key default true check (singleton),
  owner_email text,
  max_students integer not null default 10 check (max_students between 1 and 100),
  max_upload_bytes bigint not null default 891289600
);
insert into internal.app_config (singleton) values (true) on conflict do nothing;

create table if not exists public.app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_owner boolean not null default false,
  admitted boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function internal.register_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  configuration internal.app_config%rowtype;
  owner_match boolean;
  seat_available boolean;
begin
  perform pg_catalog.pg_advisory_xact_lock(72300426);
  select * into configuration from internal.app_config where singleton = true;
  owner_match := configuration.owner_email is not null and lower(new.email) = lower(configuration.owner_email);
  select count(*) < configuration.max_students into seat_available
    from public.app_profiles where admitted and not is_owner;
  insert into public.app_profiles(user_id, is_owner, admitted)
    values (new.id, owner_match, owner_match or seat_available);
  return new;
end;
$$;
revoke all on function internal.register_user() from public, anon, authenticated;
drop trigger if exists cpale_register_user on auth.users;
create trigger cpale_register_user after insert on auth.users
  for each row execute function internal.register_user();

create table if not exists public.exam_cycles (
  id text primary key,
  label text not null,
  starts_on date,
  ends_on date,
  status text not null check (status in ('provisional','confirmed')),
  source_url text,
  updated_at timestamptz not null default now()
);
create table if not exists public.syllabus_subjects (
  id text primary key,
  name text not null,
  abbreviation text not null,
  position integer not null,
  source_url text not null
);
create table if not exists public.syllabus_topics (
  id text primary key,
  subject_id text not null references public.syllabus_subjects(id),
  code text not null,
  title text not null,
  section text not null,
  source_page integer not null,
  status text not null default 'needs_editorial_review' check (status in ('needs_editorial_review','approved'))
);
create index if not exists syllabus_topics_subject_idx on public.syllabus_topics(subject_id);
create table if not exists public.topic_guides (
  topic_id text primary key references public.syllabus_topics(id) on delete cascade,
  summary text not null,
  lecture_prompt text not null,
  practice_prompt text not null,
  source_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  reviewed_at timestamptz
);
create table if not exists public.starter_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null references public.syllabus_topics(id) on delete cascade,
  stem text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer_index integer not null check (answer_index between 0 and 3),
  explanation text not null,
  source_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists starter_questions_topic_idx on public.starter_questions(topic_id);

create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.personal_questions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.syllabus_topics(id),
  stem text not null,
  options jsonb not null,
  answer_index integer not null check (answer_index between 0 and 3),
  explanation text not null,
  source_url text,
  created_at timestamptz not null default now()
);
create index if not exists personal_questions_user_idx on public.personal_questions(user_id);
create table if not exists public.quiz_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_ids jsonb not null,
  responses jsonb not null,
  score integer not null,
  duration_seconds integer not null,
  created_at timestamptz not null default now()
);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id, created_at desc);
create table if not exists public.material_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.syllabus_topics(id),
  storage_path text not null unique,
  original_name text not null,
  bytes bigint not null check (bytes > 0 and bytes <= 10485760),
  created_at timestamptz not null default now()
);
create index if not exists material_files_user_idx on public.material_files(user_id);

alter table public.app_profiles enable row level security;
alter table public.exam_cycles enable row level security;
alter table public.syllabus_subjects enable row level security;
alter table public.syllabus_topics enable row level security;
alter table public.topic_guides enable row level security;
alter table public.starter_questions enable row level security;
alter table public.user_workspaces enable row level security;
alter table public.personal_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.material_files enable row level security;

create policy "profiles_read_own" on public.app_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "cycles_read" on public.exam_cycles for select to anon, authenticated using (true);
create policy "subjects_read" on public.syllabus_subjects for select to anon, authenticated using (true);
create policy "topics_read" on public.syllabus_topics for select to anon, authenticated using (true);
create policy "guides_read_published" on public.topic_guides for select to anon, authenticated using (status = 'published');
create policy "questions_read_published" on public.starter_questions for select to anon, authenticated using (status = 'published');
create policy "workspace_own" on public.user_workspaces for all to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.app_profiles p where p.user_id = (select auth.uid()) and p.admitted))
  with check ((select auth.uid()) = user_id and exists (select 1 from public.app_profiles p where p.user_id = (select auth.uid()) and p.admitted));
create policy "personal_questions_own" on public.personal_questions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "quiz_attempts_own" on public.quiz_attempts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "material_files_own" on public.material_files for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.exam_cycles, public.syllabus_subjects, public.syllabus_topics, public.topic_guides, public.starter_questions to anon, authenticated;
grant select on public.app_profiles to authenticated;
grant select, insert, update, delete on public.user_workspaces, public.personal_questions, public.quiz_attempts, public.material_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('materials', 'materials', false, 10485760, array['application/pdf','image/png','image/jpeg','image/webp'])
  on conflict (id) do update set public = false, file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf','image/png','image/jpeg','image/webp'];
create policy "materials_read_own" on storage.objects for select to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);
