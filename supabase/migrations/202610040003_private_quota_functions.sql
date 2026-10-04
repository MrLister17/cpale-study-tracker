-- Keep privileged quota checks in an unexposed schema. Public RPCs are invokers.
alter function public.reserve_material_upload(text,text,bigint,text) set schema internal;
alter function public.finish_material_upload(uuid) set schema internal;
alter function public.cancel_material_upload(uuid) set schema internal;

grant usage on schema internal to authenticated;
grant execute on function internal.reserve_material_upload(text,text,bigint,text) to authenticated;
grant execute on function internal.finish_material_upload(uuid) to authenticated;
grant execute on function internal.cancel_material_upload(uuid) to authenticated;

create function public.reserve_material_upload(p_topic_id text, p_name text, p_bytes bigint, p_mime text)
returns table(file_id uuid, storage_path text)
language sql security invoker set search_path = '' as $$
  select * from internal.reserve_material_upload(p_topic_id,p_name,p_bytes,p_mime);
$$;
create function public.finish_material_upload(p_id uuid)
returns void language sql security invoker set search_path = '' as $$
  select internal.finish_material_upload(p_id);
$$;
create function public.cancel_material_upload(p_id uuid)
returns void language sql security invoker set search_path = '' as $$
  select internal.cancel_material_upload(p_id);
$$;
revoke all on function public.reserve_material_upload(text,text,bigint,text) from public, anon;
revoke all on function public.finish_material_upload(uuid) from public, anon;
revoke all on function public.cancel_material_upload(uuid) from public, anon;
grant execute on function public.reserve_material_upload(text,text,bigint,text) to authenticated;
grant execute on function public.finish_material_upload(uuid) to authenticated;
grant execute on function public.cancel_material_upload(uuid) to authenticated;

create index if not exists personal_questions_topic_idx on public.personal_questions(topic_id);
create index if not exists material_files_topic_idx on public.material_files(topic_id);
