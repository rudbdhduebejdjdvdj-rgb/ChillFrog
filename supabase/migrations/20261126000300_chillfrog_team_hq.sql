-- ChillFrog Team & HQ: public profiles, private tasks and contributions.
create schema if not exists private;
create table if not exists public.team_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('founder','co_founder')),
  created_at timestamptz not null default now()
);
alter table public.team_admins enable row level security;
create or replace function private.is_team_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.team_admins a where a.user_id = (select auth.uid())); $$;
revoke all on function private.is_team_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_team_admin() to authenticated;
create policy "Admins can see their own team role" on public.team_admins for select to authenticated using (user_id = (select auth.uid()));
create policy "Admins manage team admin assignments" on public.team_admins for all to authenticated using ((select private.is_team_admin())) with check ((select private.is_team_admin()));
grant select, insert, update, delete on public.team_admins to authenticated;

create table if not exists public.team_members (
 id uuid primary key default gen_random_uuid(),
 display_name text not null check (char_length(display_name) between 1 and 70),
 role_title text not null check (char_length(role_title) between 1 and 90),
 department text not null default 'Core Team',
 bio text not null default '' check (char_length(bio) <= 500),
 avatar_url text,
 socials jsonb not null default '{}'::jsonb,
 sort_order integer not null default 100,
 is_active boolean not null default true,
 is_public boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.team_members enable row level security;
create policy "Public can view published active team members" on public.team_members for select to anon, authenticated using (is_active = true and is_public = true);
create policy "Team admins manage all team members" on public.team_members for all to authenticated using ((select private.is_team_admin())) with check ((select private.is_team_admin()));
grant select on public.team_members to anon, authenticated;
grant insert, update, delete on public.team_members to authenticated;

create table if not exists public.team_tasks (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 1 and 140),
 description text not null default '' check (char_length(description) <= 1500),
 department text not null default 'General',
 assigned_to uuid references public.team_members(id) on delete set null,
 status text not null default 'todo' check (status in ('todo','in_progress','review','done')),
 priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
 due_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.team_tasks enable row level security;
create policy "Only team admins can manage tasks" on public.team_tasks for all to authenticated using ((select private.is_team_admin())) with check ((select private.is_team_admin()));
grant select, insert, update, delete on public.team_tasks to authenticated;

create table if not exists public.team_contributions (
 id uuid primary key default gen_random_uuid(),
 member_id uuid references public.team_members(id) on delete set null,
 title text not null check (char_length(title) between 1 and 140),
 details text not null default '' check (char_length(details) <= 1200),
 contribution_type text not null default 'general',
 recognition text,
 created_at timestamptz not null default now()
);
alter table public.team_contributions enable row level security;
create policy "Only team admins can manage contributions" on public.team_contributions for all to authenticated using ((select private.is_team_admin())) with check ((select private.is_team_admin()));
grant select, insert, update, delete on public.team_contributions to authenticated;
create index if not exists team_members_public_order_idx on public.team_members(is_active,is_public,sort_order);
create index if not exists team_tasks_status_due_idx on public.team_tasks(status,due_at);
create index if not exists team_tasks_assigned_to_idx on public.team_tasks(assigned_to);
create index if not exists team_contributions_member_id_idx on public.team_contributions(member_id);
