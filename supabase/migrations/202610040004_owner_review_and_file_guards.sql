-- Owner review rights are derived from the protected profile, never user metadata.
create or replace function internal.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_owner from public.app_profiles p where p.user_id = (select auth.uid())), false);
$$;
revoke all on function internal.is_owner() from public, anon;
grant execute on function internal.is_owner() to authenticated;

create policy "owner_read_all_topics" on public.syllabus_topics for select to authenticated using (internal.is_owner());
create policy "owner_update_topics" on public.syllabus_topics for update to authenticated
  using (internal.is_owner()) with check (internal.is_owner());
create policy "owner_read_guides" on public.topic_guides for select to authenticated using (internal.is_owner());
create policy "owner_write_guides" on public.topic_guides for all to authenticated
  using (internal.is_owner()) with check (internal.is_owner());
create policy "owner_read_questions" on public.starter_questions for select to authenticated using (internal.is_owner());
create policy "owner_write_questions" on public.starter_questions for all to authenticated
  using (internal.is_owner()) with check (internal.is_owner());
grant insert, update, delete on public.topic_guides, public.starter_questions to authenticated;
grant update on public.syllabus_topics to authenticated;

alter table public.topic_guides add constraint published_guide_reviewed
  check (status <> 'published' or (reviewed_at is not null and nullif(trim(summary),'') is not null and nullif(trim(source_url),'') is not null));
alter table public.starter_questions add constraint published_question_reviewed
  check (status <> 'published' or (reviewed_at is not null and nullif(trim(explanation),'') is not null and nullif(trim(source_url),'') is not null));

-- Reservations are controlled only by server-side quota functions.
revoke insert, update, delete on public.material_files from authenticated;
drop policy "material_files_own" on public.material_files;
create policy "material_files_read_own" on public.material_files for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function internal.delete_material_upload(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare file_row public.material_files%rowtype;
begin
  select * into file_row from public.material_files where id = p_id and user_id = (select auth.uid());
  if not found then raise exception 'File not found'; end if;
  if exists (select 1 from storage.objects where bucket_id = 'materials' and name = file_row.storage_path) then
    raise exception 'Remove the stored file first';
  end if;
  delete from public.material_files where id = p_id;
end;
$$;
revoke all on function internal.delete_material_upload(uuid) from public, anon;
grant execute on function internal.delete_material_upload(uuid) to authenticated;
create function public.delete_material_upload(p_id uuid)
returns void language sql security invoker set search_path = '' as $$
  select internal.delete_material_upload(p_id);
$$;
revoke all on function public.delete_material_upload(uuid) from public, anon;
grant execute on function public.delete_material_upload(uuid) to authenticated;

create index if not exists material_files_uploaded_idx on public.material_files(uploaded) where not uploaded;
