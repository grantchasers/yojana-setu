create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  status text not null,
  description text,
  actor_role text,
  source text default 'application_record',
  created_at timestamptz not null default now()
);

create index if not exists application_status_history_application_id_created_at_idx
  on public.application_status_history (application_id, created_at);

alter table public.application_status_history enable row level security;

drop policy if exists "Applicants can read their application status history"
  on public.application_status_history;
create policy "Applicants can read their application status history"
  on public.application_status_history
  for select
  using (
    exists (
      select 1
      from public.applications a
      where a.id = application_status_history.application_id
        and a.user_id = auth.uid()
    )
  );

drop policy if exists "Applicants can insert their submitted status history"
  on public.application_status_history;
create policy "Applicants can insert their submitted status history"
  on public.application_status_history
  for insert
  with check (
    status = 'submitted'
    and exists (
      select 1
      from public.applications a
      where a.id = application_status_history.application_id
        and a.user_id = auth.uid()
    )
  );

create or replace function public.record_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_status_history (application_id, status, description, source)
    values (new.id, new.status, 'Application created with status ' || new.status || '.', 'application_trigger');
  elsif old.status is distinct from new.status then
    insert into public.application_status_history (application_id, status, description, source)
    values (new.id, new.status, 'Application status changed from ' || coalesce(old.status, 'unknown') || ' to ' || new.status || '.', 'application_trigger');
  end if;
  return new;
end;
$$;

drop trigger if exists applications_status_history_trigger on public.applications;
create trigger applications_status_history_trigger
after insert or update of status on public.applications
for each row execute function public.record_application_status_change();

alter table public.application_status_history replica identity full;

-- Enable realtime for live tracking. This is idempotent when the table is already present.
alter publication supabase_realtime add table public.applications;
alter publication supabase_realtime add table public.application_status_history;
