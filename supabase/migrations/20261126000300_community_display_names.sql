-- Add user-chosen public nicknames without exposing email addresses.
alter table public.community_profiles
  add column if not exists display_name text;

alter table public.community_profiles
  drop constraint if exists community_display_name_format;

alter table public.community_profiles
  add constraint community_display_name_format
  check (
    display_name is null
    or (
      char_length(trim(display_name)) between 2 and 24
      and display_name !~ '[<>]'
    )
  );

create or replace view public.community_leaderboard with (security_invoker = true) as
select
  p.id as user_id,
  p.handle,
  coalesce(posts.approved_posts,0)::integer as approved_posts,
  coalesce(missions.approved_missions,0)::integer as approved_missions,
  (coalesce(posts.approved_posts,0)*5 + coalesce(missions.approved_points,0))::integer as points,
  p.display_name
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

grant select on public.community_profiles, public.community_leaderboard to anon, authenticated;
grant update (display_name) on public.community_profiles to authenticated;
