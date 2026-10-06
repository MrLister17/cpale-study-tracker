-- Rich lessons retain goals, worked examples, citations, and review metadata.
-- The draft source is private; only explicit owner publication exposes a row.
create table public.study_lessons (
  id text primary key,
  subject_id text not null references public.syllabus_subjects(id),
  title text not null check (length(btrim(title)) > 0),
  topic_ids text[] not null check (cardinality(topic_ids) > 0),
  learning_goals jsonb not null check (jsonb_typeof(learning_goals) = 'array' and jsonb_array_length(learning_goals) >= 2),
  key_points jsonb not null check (jsonb_typeof(key_points) = 'array' and jsonb_array_length(key_points) >= 2),
  worked_example jsonb not null check (
    jsonb_typeof(worked_example) = 'object'
    and coalesce(length(btrim(worked_example->>'scenario')), 0) > 0
    and jsonb_typeof(worked_example->'steps') = 'array'
    and jsonb_array_length(worked_example->'steps') >= 2
    and coalesce(length(btrim(worked_example->>'takeaway')), 0) > 0
  ),
  common_mistake text not null check (length(btrim(common_mistake)) > 0),
  practice_prompt text not null check (length(btrim(practice_prompt)) > 0),
  sources jsonb not null check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) >= 1),
  applicability_note text not null check (length(btrim(applicability_note)) > 0),
  status text not null default 'draft' check (status in ('draft', 'published')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_lesson_reviewed check (
    status <> 'published' or (reviewed_at is not null and reviewed_by is not null)
  )
);

create index study_lessons_subject_status_idx on public.study_lessons(subject_id, status);
create index study_lessons_topic_ids_idx on public.study_lessons using gin(topic_ids);

alter table public.study_lessons enable row level security;
revoke all on table public.study_lessons from anon, authenticated;
grant select on table public.study_lessons to anon, authenticated;
grant insert, update, delete on table public.study_lessons to authenticated;

create policy "study_lessons_read_anon" on public.study_lessons
  for select to anon using (status = 'published');
create policy "study_lessons_read_auth" on public.study_lessons
  for select to authenticated using (status = 'published' or (select internal.is_owner()));
create policy "study_lessons_insert_owner" on public.study_lessons
  for insert to authenticated with check ((select internal.is_owner()));
create policy "study_lessons_update_owner" on public.study_lessons
  for update to authenticated using ((select internal.is_owner())) with check ((select internal.is_owner()));
create policy "study_lessons_delete_owner" on public.study_lessons
  for delete to authenticated using ((select internal.is_owner()));

-- Keep linked syllabus outcomes real, distinct, and in the lesson's subject.
create function internal.validate_study_lesson_topics()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if (select count(*) from unnest(new.topic_ids) as ids(id)) <>
     (select count(distinct id) from unnest(new.topic_ids) as ids(id)) then
    raise exception 'Lesson topic IDs must be distinct';
  end if;
  if exists (
    select 1 from unnest(new.topic_ids) as ids(id)
    left join public.syllabus_topics t on t.id = ids.id
    where t.id is null or t.subject_id <> new.subject_id
  ) then
    raise exception 'Lesson topics must exist within the selected subject';
  end if;
  if new.status = 'published' then
    if new.reviewed_by is distinct from (select auth.uid()) then
      raise exception 'The publishing owner must be the recorded reviewer';
    end if;
    if exists (
      select 1 from unnest(new.topic_ids) as ids(id)
      join public.syllabus_topics t on t.id = ids.id
      where t.status <> 'approved'
    ) then
      raise exception 'Approve every linked syllabus outcome before publishing';
    end if;
    if exists (
      select 1 from jsonb_array_elements(new.sources) as s(source)
      where coalesce(s.source->>'url', '') !~ '^https://'
         or coalesce(s.source->>'title', '') = ''
         or coalesce(s.source->>'checkedOn', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    ) then
      raise exception 'Published lessons require titled HTTPS sources and checked dates';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function internal.validate_study_lesson_topics() from public, anon;
create trigger validate_study_lesson_topics_before_write
  before insert or update on public.study_lessons
  for each row execute function internal.validate_study_lesson_topics();

-- The PDF has a three-outcome AFAR translation section that the earlier
-- generic extractor missed. These rows remain unapproved for human review.
insert into public.syllabus_topics(id, subject_id, code, title, section, source_page, status) values
  ('afar-060', 'afar', '10.0.1', 'Translate from the Functional Currency into the Presentation Currency using closing/current rate method', 'Translation of Foreign Currency Financial Statements (PAS 21 / PAS 29)', 11, 'needs_editorial_review'),
  ('afar-061', 'afar', '10.0.2', 'Translate into Functional Currency (Remeasurement from Foreign Currency Financial Statements to the Functional Currency)', 'Translation of Foreign Currency Financial Statements (PAS 21 / PAS 29)', 11, 'needs_editorial_review'),
  ('afar-062', 'afar', '10.0.3', 'Restate the Financial Statements (Functional Currency of a Hyperinflationary Economy)', 'Translation of Foreign Currency Financial Statements (PAS 21 / PAS 29)', 11, 'needs_editorial_review')
on conflict (id) do nothing;
