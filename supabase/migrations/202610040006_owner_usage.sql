create function internal.owner_usage()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not internal.is_owner() then raise exception 'Owner access required'; end if;
  return pg_catalog.jsonb_build_object(
    'students', (select count(*) from public.app_profiles where admitted and not is_owner),
    'waitlist', (select count(*) from public.beta_waitlist),
    'storage_bytes', (select coalesce(sum(bytes),0) from public.material_files),
    'approved_topics', (select count(*) from public.syllabus_topics where status='approved'),
    'published_guides', (select count(*) from public.topic_guides where status='published'),
    'published_questions', (select count(*) from public.starter_questions where status='published')
  );
end;
$$;
revoke all on function internal.owner_usage() from public, anon;
grant execute on function internal.owner_usage() to authenticated;
create function public.owner_usage()
returns jsonb language sql security invoker set search_path = '' as $$ select internal.owner_usage(); $$;
revoke all on function public.owner_usage() from public, anon;
grant execute on function public.owner_usage() to authenticated;
