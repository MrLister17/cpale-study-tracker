create or replace function internal.is_admitted()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.admitted from public.app_profiles p where p.user_id = (select auth.uid())), false);
$$;
revoke all on function internal.is_admitted() from public, anon;
grant execute on function internal.is_admitted() to authenticated;

drop policy "personal_questions_own" on public.personal_questions;
create policy "personal_questions_admitted_own" on public.personal_questions for all to authenticated
  using ((select auth.uid()) = user_id and internal.is_admitted())
  with check ((select auth.uid()) = user_id and internal.is_admitted());
drop policy "quiz_attempts_own" on public.quiz_attempts;
create policy "quiz_attempts_admitted_own" on public.quiz_attempts for all to authenticated
  using ((select auth.uid()) = user_id and internal.is_admitted())
  with check ((select auth.uid()) = user_id and internal.is_admitted());
