create index account_requests_user_idx on public.account_requests(user_id);

drop policy "owner_read_all_topics" on public.syllabus_topics;

drop policy "owner_manage_cycles" on public.exam_cycles;
create policy "owner_insert_cycles" on public.exam_cycles for insert to authenticated with check (internal.is_owner());
create policy "owner_update_cycles" on public.exam_cycles for update to authenticated using (internal.is_owner()) with check (internal.is_owner());
create policy "owner_delete_cycles" on public.exam_cycles for delete to authenticated using (internal.is_owner());

drop policy "guides_read_published" on public.topic_guides;
drop policy "owner_read_guides" on public.topic_guides;
drop policy "owner_write_guides" on public.topic_guides;
create policy "guides_read_anon" on public.topic_guides for select to anon using (status = 'published');
create policy "guides_read_auth" on public.topic_guides for select to authenticated using (status = 'published' or internal.is_owner());
create policy "guides_insert_owner" on public.topic_guides for insert to authenticated with check (internal.is_owner());
create policy "guides_update_owner" on public.topic_guides for update to authenticated using (internal.is_owner()) with check (internal.is_owner());
create policy "guides_delete_owner" on public.topic_guides for delete to authenticated using (internal.is_owner());

drop policy "questions_read_published" on public.starter_questions;
drop policy "owner_read_questions" on public.starter_questions;
drop policy "owner_write_questions" on public.starter_questions;
create policy "questions_read_anon" on public.starter_questions for select to anon using (status = 'published');
create policy "questions_read_auth" on public.starter_questions for select to authenticated using (status = 'published' or internal.is_owner());
create policy "questions_insert_owner" on public.starter_questions for insert to authenticated with check (internal.is_owner());
create policy "questions_update_owner" on public.starter_questions for update to authenticated using (internal.is_owner()) with check (internal.is_owner());
create policy "questions_delete_owner" on public.starter_questions for delete to authenticated using (internal.is_owner());
