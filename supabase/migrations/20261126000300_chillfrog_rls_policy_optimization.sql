-- Consolidate overlapping moderator read policies to keep RLS evaluation efficient.
drop policy if exists "Moderators manage events" on public.community_events;
create policy "Moderators create events" on public.community_events for insert to authenticated
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
create policy "Moderators update events" on public.community_events for update to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
create policy "Moderators delete events" on public.community_events for delete to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));

drop policy if exists "Moderators manage polls" on public.community_polls;
create policy "Moderators create polls" on public.community_polls for insert to authenticated
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
create policy "Moderators update polls" on public.community_polls for update to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
create policy "Moderators delete polls" on public.community_polls for delete to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));

drop policy if exists "Moderators manage poll options" on public.community_poll_options;
create policy "Moderators create poll options" on public.community_poll_options for insert to authenticated
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
create policy "Moderators update poll options" on public.community_poll_options for update to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
create policy "Moderators delete poll options" on public.community_poll_options for delete to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));

drop policy if exists "Moderators manage missions" on public.community_missions;
create policy "Moderators create missions" on public.community_missions for insert to authenticated
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
create policy "Moderators update missions" on public.community_missions for update to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())))
with check (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));
create policy "Moderators delete missions" on public.community_missions for delete to authenticated
using (exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid())));

drop policy if exists "Moderators can view pending posts" on public.community_posts;
drop policy if exists "Approved posts and own submissions are visible" on public.community_posts;
create policy "Posts visible to public authors and moderators" on public.community_posts
for select to anon, authenticated using (
 status='approved' or (select auth.uid())=author_id
 or exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid()))
);

drop policy if exists "Moderators can review mission submissions" on public.community_mission_completions;
drop policy if exists "Users see approved mission completions" on public.community_mission_completions;
create policy "Mission submissions visible to owners and moderators" on public.community_mission_completions
for select to anon, authenticated using (
 status='approved' or (select auth.uid())=user_id
 or exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid()))
);

drop policy if exists "Moderators can review reports" on public.community_reports;
drop policy if exists "Users see their own reports" on public.community_reports;
create policy "Reports visible to reporter and moderators" on public.community_reports
for select to authenticated using (
 (select auth.uid())=reporter_id
 or exists (select 1 from public.community_moderators m where m.user_id=(select auth.uid()))
);
