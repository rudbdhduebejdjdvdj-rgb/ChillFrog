-- ChillFrog production hardening after initial community schema.
alter function public.enforce_community_post_rate_limit() set search_path = public, pg_temp;
create index if not exists community_poll_options_poll_id_idx on public.community_poll_options(poll_id);
create index if not exists community_poll_votes_option_poll_idx on public.community_poll_votes(option_id,poll_id);
create index if not exists community_poll_votes_user_id_idx on public.community_poll_votes(user_id);
create index if not exists community_post_likes_user_id_idx on public.community_post_likes(user_id);
create index if not exists community_reports_post_id_idx on public.community_reports(post_id);
create index if not exists community_reports_reporter_id_idx on public.community_reports(reporter_id);
revoke update on public.community_posts from authenticated;
grant update(status) on public.community_posts to authenticated;
