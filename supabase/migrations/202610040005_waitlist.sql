create table public.beta_waitlist (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.beta_waitlist enable row level security;
create policy "waitlist_read_own" on public.beta_waitlist for select to authenticated
  using ((select auth.uid()) = user_id);
grant select on public.beta_waitlist to authenticated;

create or replace function internal.register_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  configuration internal.app_config%rowtype;
  owner_match boolean;
  seat_available boolean;
begin
  perform pg_catalog.pg_advisory_xact_lock(72300426);
  select * into configuration from internal.app_config where singleton = true;
  owner_match := configuration.owner_email is not null and lower(new.email) = lower(configuration.owner_email);
  select count(*) < configuration.max_students into seat_available
    from public.app_profiles where admitted and not is_owner;
  insert into public.app_profiles(user_id, is_owner, admitted)
    values (new.id, owner_match, owner_match or seat_available);
  if not owner_match and not seat_available then
    insert into public.beta_waitlist(user_id) values (new.id);
  end if;
  return new;
end;
$$;
