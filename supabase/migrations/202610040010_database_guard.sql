alter table public.user_workspaces add constraint workspace_size_guard
  check (pg_catalog.octet_length(data::text) <= 5242880);

create or replace function internal.owner_usage()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not internal.is_owner() then raise exception 'Owner access required'; end if;
  return pg_catalog.jsonb_build_object(
    'students', (select count(*) from public.app_profiles where admitted and not is_owner),
    'waitlist', (select count(*) from public.beta_waitlist),
    'storage_bytes', (select coalesce(sum(bytes),0) from public.material_files),
    'database_bytes', (select pg_catalog.pg_database_size(pg_catalog.current_database())),
    'approved_topics', (select count(*) from public.syllabus_topics where status='approved'),
    'published_guides', (select count(*) from public.topic_guides where status='published'),
    'published_questions', (select count(*) from public.starter_questions where status='published')
  );
end;
$$;
