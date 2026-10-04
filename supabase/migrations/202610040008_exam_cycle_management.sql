insert into public.exam_cycles(id,label,starts_on,ends_on,status,source_url)
values ('2027-may','May 2027 CPALE',null,null,'provisional',null)
on conflict (id) do nothing;
create policy "owner_manage_cycles" on public.exam_cycles for all to authenticated
  using (internal.is_owner()) with check (internal.is_owner());
grant insert, update, delete on public.exam_cycles to authenticated;
