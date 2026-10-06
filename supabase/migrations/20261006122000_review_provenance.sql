-- Record the authenticated owner who publishes guides and starter questions.
alter table public.topic_guides add column reviewed_by uuid references auth.users(id);
alter table public.starter_questions add column reviewed_by uuid references auth.users(id);

create index topic_guides_reviewer_idx on public.topic_guides(reviewed_by);
create index starter_questions_reviewer_idx on public.starter_questions(reviewed_by);
create index study_lessons_reviewer_idx on public.study_lessons(reviewed_by);

create function internal.enforce_content_publication()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  linked_topic text;
begin
  if new.status <> 'published' then return new; end if;
  if new.reviewed_by is distinct from (select auth.uid()) or new.reviewed_at is null then
    raise exception 'Published content must record the authenticated reviewer and review date';
  end if;
  if new.source_url is null or new.source_url !~ '^https://' then
    raise exception 'Published content needs an HTTPS source';
  end if;
  linked_topic := new.topic_id;
  if not exists (select 1 from public.syllabus_topics where id = linked_topic and status = 'approved') then
    raise exception 'Approve the linked syllabus outcome before publishing';
  end if;
  return new;
end;
$$;
revoke all on function internal.enforce_content_publication() from public, anon;

create trigger guide_publication_guard before insert or update on public.topic_guides
for each row execute function internal.enforce_content_publication();
create trigger question_publication_guard before insert or update on public.starter_questions
for each row execute function internal.enforce_content_publication();
