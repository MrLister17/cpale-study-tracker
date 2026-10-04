create table public.account_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('export','delete')),
  status text not null default 'pending' check (status in ('pending','complete')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index account_requests_pending_idx on public.account_requests(status, created_at) where status = 'pending';
alter table public.account_requests enable row level security;
create policy "request_read_own_or_owner" on public.account_requests for select to authenticated
  using ((select auth.uid()) = user_id or internal.is_owner());
create policy "request_create_own" on public.account_requests for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending' and completed_at is null);
create policy "request_update_owner" on public.account_requests for update to authenticated
  using (internal.is_owner()) with check (internal.is_owner());
grant select, insert, update on public.account_requests to authenticated;
