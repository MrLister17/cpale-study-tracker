alter table public.material_files add column if not exists uploaded boolean not null default false;

create or replace function public.reserve_material_upload(
  p_topic_id text, p_name text, p_bytes bigint, p_mime text
) returns table(file_id uuid, storage_path text)
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  profile public.app_profiles%rowtype;
  cfg internal.app_config%rowtype;
  used_total bigint;
  used_user bigint;
  new_id uuid;
  ext text;
  new_path text;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into profile from public.app_profiles where user_id = uid;
  if not found or not profile.admitted then raise exception 'Beta access is not available'; end if;
  if p_bytes < 1 or p_bytes > 10485760 then raise exception 'File must be 10 MB or smaller'; end if;
  if length(p_name) > 200 then raise exception 'File name is too long'; end if;
  if not exists (select 1 from public.syllabus_topics where id = p_topic_id) then raise exception 'Unknown topic'; end if;
  ext := case p_mime when 'application/pdf' then 'pdf' when 'image/png' then 'png'
    when 'image/jpeg' then 'jpg' when 'image/webp' then 'webp' else null end;
  if ext is null then raise exception 'Unsupported file type'; end if;
  perform pg_catalog.pg_advisory_xact_lock(72300427);
  select * into cfg from internal.app_config where singleton = true;
  select coalesce(sum(bytes), 0) into used_total from public.material_files;
  select coalesce(sum(bytes), 0) into used_user from public.material_files where user_id = uid;
  if used_total + p_bytes > cfg.max_upload_bytes then raise exception 'Project storage guard reached'; end if;
  if not profile.is_owner and used_user + p_bytes > 52428800 then raise exception 'Your 50 MB upload allowance is full'; end if;
  new_id := gen_random_uuid();
  new_path := uid::text || '/' || new_id::text || '.' || ext;
  insert into public.material_files(id, user_id, topic_id, storage_path, original_name, bytes)
    values (new_id, uid, p_topic_id, new_path, p_name, p_bytes);
  file_id := new_id;
  storage_path := new_path;
  return next;
end;
$$;

create or replace function public.finish_material_upload(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.material_files set uploaded = true
    where id = p_id and user_id = (select auth.uid());
end;
$$;

create or replace function public.cancel_material_upload(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.material_files
    where id = p_id and user_id = (select auth.uid()) and not uploaded;
end;
$$;

revoke all on function public.reserve_material_upload(text,text,bigint,text) from public, anon;
revoke all on function public.finish_material_upload(uuid) from public, anon;
revoke all on function public.cancel_material_upload(uuid) from public, anon;
grant execute on function public.reserve_material_upload(text,text,bigint,text) to authenticated;
grant execute on function public.finish_material_upload(uuid) to authenticated;
grant execute on function public.cancel_material_upload(uuid) to authenticated;

create policy "materials_insert_reserved" on storage.objects for insert to authenticated
  with check (bucket_id = 'materials' and exists (
    select 1 from public.material_files f where f.storage_path = name
      and f.user_id = (select auth.uid()) and not f.uploaded
  ));
create policy "materials_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);
