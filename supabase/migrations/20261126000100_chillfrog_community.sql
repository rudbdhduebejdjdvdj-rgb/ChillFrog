-- ChillFrog community foundation. Apply only to the dedicated ChillFrog Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.community_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  created_at timestamptz not null default now(),
  constraint community_handle_format check (handle ~ '^[A-Za-z0-9_]{3,18}$')
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.community_profiles(id) on delete cascade,
  kind text not null check (kind in ('meme','idea')),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 600),
  image_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.community_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id,user_id)
);

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) between 1 and 1000),
  event_type text not null check (event_type in ('ama','community_call','contest','announcement')),
  starts_at timestamptz not null,
  url text,
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','open','closed')),
  created_at timestamptz not null default now(),
  constraint poll_dates_valid check (ends_at > starts_at)
);

create table if not exists public.community_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.community_polls(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  unique (id,poll_id)
);

create table if not exists public.community_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.community_polls(id) on delete cascade,
  option_id uuid not null,
  user_id uuid not null references public.community_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id,user_id),
  foreign key (option_id,poll_id) references public.community_poll_options(id,poll_id) on delete cascade
);

create table if not exists public.community_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) between 1 and 600),
  points integer not null default 5 check (points between 1 and 50),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft','active','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_mission_completions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.community_missions(id) on delete cascade,
  user_id uuid not null references public.community_profiles(id) on delete cascade,
  note text not null default '' check (char_length(note) <= 400),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (mission_id,user_id)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.community_profiles(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reason text not null check (reason in ('spam','harassment','scam','private_information','other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists community_posts_public_feed_idx on public.community_posts(status,created_at desc);
create index if not exists community_posts_author_idx on public.community_posts(author_id,created_at desc);
create index if not exists community_likes_post_idx on public.community_post_likes(post_id);
create index if not exists community_events_public_idx on public.community_events(status,starts_at);
create index if not exists community_polls_public_idx on public.community_polls(status,ends_at);
create index if not exists community_missions_public_idx on public.community_missions(status,starts_at);
create index if not exists community_mission_scores_idx on public.community_mission_completions(user_id,status);

alter table public.community_profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_post_likes enable row level security;
alter table public.community_events enable row level security;
alter table public.community_polls enable row level security;
alter table public.community_poll_options enable row level security;
alter table public.community_poll_votes enable row level security;
alter table public.community_missions enable row level security;
alter table public.community_mission_completions enable row level security;
alter table public.community_reports enable row level security;

create policy "Community profiles are public" on public.community_profiles for select to anon, authenticated using (true);
create policy "Users create their own community profile" on public.community_profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update their own community profile" on public.community_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Approved posts and own submissions are visible" on public.community_posts for select to anon, authenticated using (status = 'approved' or ((select auth.uid()) = author_id));
create policy "Users submit pending posts" on public.community_posts for insert to authenticated with check ((select auth.uid()) = author_id and status = 'pending');
create policy "Users may delete their own pending posts" on public.community_posts for delete to authenticated using ((select auth.uid()) = author_id and status = 'pending');

create policy "Likes on approved posts are visible" on public.community_post_likes for select to anon, authenticated using (exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'approved'));
create policy "Users like approved posts once" on public.community_post_likes for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'approved'));
create policy "Users remove their own likes" on public.community_post_likes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Published events are public" on public.community_events for select to anon, authenticated using (status = 'published');
create policy "Open and closed polls are public" on public.community_polls for select to anon, authenticated using (status in ('open','closed'));
create policy "Options of public polls are public" on public.community_poll_options for select to anon, authenticated using (exists (select 1 from public.community_polls p where p.id = poll_id and p.status in ('open','closed')));
create policy "Users see public poll votes" on public.community_poll_votes for select to authenticated using (true);
create policy "Users vote once per poll" on public.community_poll_votes for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.community_polls p where p.id = poll_id and p.status = 'open' and now() between p.starts_at and p.ends_at));
create policy "Users may change their vote while poll is open" on public.community_poll_votes for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.community_polls p where p.id = poll_id and p.status = 'open' and now() between p.starts_at and p.ends_at));

create policy "Active missions are public" on public.community_missions for select to anon, authenticated using (status = 'active');
create policy "Users see approved mission completions" on public.community_mission_completions for select to anon, authenticated using (status = 'approved' or ((select auth.uid()) = user_id));
create policy "Users submit their own mission completion" on public.community_mission_completions for insert to authenticated with check ((select auth.uid()) = user_id and status = 'pending');
create policy "Users report posts" on public.community_reports for insert to authenticated with check ((select auth.uid()) = reporter_id);
create policy "Users see their own reports" on public.community_reports for select to authenticated using ((select auth.uid()) = reporter_id);

create or replace view public.community_leaderboard with (security_invoker = true) as
select
  p.id as user_id,
  p.handle,
  coalesce(posts.approved_posts,0)::integer as approved_posts,
  coalesce(missions.approved_missions,0)::integer as approved_missions,
  (coalesce(posts.approved_posts,0)*5 + coalesce(missions.approved_points,0))::integer as points
from public.community_profiles p
left join (
  select author_id,count(*) as approved_posts
  from public.community_posts where status='approved' group by author_id
) posts on posts.author_id=p.id
left join (
  select c.user_id,count(*) as approved_missions,sum(m.points) as approved_points
  from public.community_mission_completions c
  join public.community_missions m on m.id=c.mission_id
  where c.status='approved' group by c.user_id
) missions on missions.user_id=p.id;

grant select on public.community_profiles, public.community_posts, public.community_post_likes,
 public.community_events, public.community_polls, public.community_poll_options,
 public.community_missions, public.community_mission_completions, public.community_leaderboard to anon, authenticated;
grant insert, update on public.community_profiles to authenticated;
grant insert, delete on public.community_posts to authenticated;
grant select, insert, delete on public.community_post_likes to authenticated;
revoke all on public.community_poll_votes from anon, authenticated;
grant select (poll_id,option_id,created_at) on public.community_poll_votes to authenticated;
grant insert, delete on public.community_poll_votes to authenticated;
grant insert, select on public.community_reports to authenticated;
grant insert, select on public.community_mission_completions to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('community-media','community-media',false,8388608,array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "Users upload their own community media" on storage.objects
for insert to authenticated with check (
  bucket_id='community-media' and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy "Approved community media is readable" on storage.objects
for select to anon, authenticated using (
  bucket_id='community-media' and exists (
    select 1 from public.community_posts p
    where p.image_path=name and p.status='approved'
  )
);
create policy "Users delete their own community media" on storage.objects
for delete to authenticated using (
  bucket_id='community-media' and (storage.foldername(name))[1]=(select auth.uid())::text
);

-- Moderator identities are provisioned manually by the project owner; there is no public self-promotion path.
create table if not exists public.community_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.community_moderators enable row level security;
create policy "Moderators can see their own role" on public.community_moderators
for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.community_moderators to authenticated;

create policy "Moderators can view pending posts" on public.community_posts
for select to authenticated using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));

create policy "Moderators can update post moderation status" on public.community_posts
for update to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
grant update on public.community_posts to authenticated;

create policy "Moderators can review reports" on public.community_reports
for select to authenticated using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
create policy "Moderators can update reports" on public.community_reports
for update to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
grant update on public.community_reports to authenticated;

create policy "Moderators manage events" on public.community_events
for all to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
grant insert, update, delete on public.community_events to authenticated;

create policy "Moderators manage polls" on public.community_polls
for all to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
grant insert, update, delete on public.community_polls to authenticated;

create policy "Moderators manage poll options" on public.community_poll_options
for all to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
grant insert, update, delete on public.community_poll_options to authenticated;

create policy "Moderators manage missions" on public.community_missions
for all to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
grant insert, update, delete on public.community_missions to authenticated;

create policy "Moderators review mission completions" on public.community_mission_completions
for update to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
grant update on public.community_mission_completions to authenticated;

create policy "Moderators can review mission submissions" on public.community_mission_completions
for select to authenticated using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));

create policy "Moderators can read pending community media" on storage.objects
for select to authenticated using (
  bucket_id='community-media' and exists (
    select 1 from public.community_posts p
    where p.image_path=name and p.status='pending'
      and exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid()))
  )
);

create or replace function public.enforce_community_post_rate_limit()
returns trigger
language plpgsql
as $$
declare recent_posts integer;
begin
  select count(*) into recent_posts
  from public.community_posts
  where author_id = new.author_id
    and created_at > now() - interval '1 hour';
  if recent_posts >= 5 then
    raise exception 'Community posting limit reached. Try again later.';
  end if;
  return new;
end;
$$;

create trigger community_posts_rate_limit
before insert on public.community_posts
for each row execute function public.enforce_community_post_rate_limit();

-- Separate on-chain buyer leaderboard, populated only by a trusted server-side indexer.
create table if not exists public.token_buyer_leaderboard (
  period text not null check (period in ('24h','all_time')),
  wallet_address text not null check (char_length(wallet_address) between 32 and 64),
  buy_volume_usd numeric(24,8) not null default 0 check (buy_volume_usd >= 0),
  buy_count integer not null default 0 check (buy_count >= 0),
  last_buy_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (period,wallet_address)
);
alter table public.token_buyer_leaderboard enable row level security;
create policy "Buyer leaderboard is public" on public.token_buyer_leaderboard
for select to anon, authenticated using (true);
grant select on public.token_buyer_leaderboard to anon, authenticated;
