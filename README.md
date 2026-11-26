# ChillFrog

Lightweight static community site hosted on GitHub Pages.

## Frontend
- Compact CFROG live market card via Jupiter Tokens API v2 (60-second refresh).
- Jupiter swap widget with the official CFROG mint.
- Local meme generator with PNG export; uploaded source images remain in the browser.
- Supabase community: guest profiles, moderated posts, likes, reports, polls, events, missions and contributor leaderboard.
- Separate on-chain buyer leaderboard; requires a trusted indexer before it can show verified buys.

## Hosting
GitHub Pages: Settings → Pages → Deploy from branch → `main` → `/(root)`.

## Supabase project
Project: `ChillFrog` · Region: `eu-west-3` (Paris) · Free plan.
Frontend connection lives in `community-config.js`. It contains only the public publishable key. Never commit a service-role key or third-party API secret.

Applied database migrations:
- `20261126000100_chillfrog_community.sql`
- `20261126000200_chillfrog_security_hardening.sql`

### Required launch configuration
1. Email passwordless sign-in is used. Confirm the Email provider is enabled in Supabase Authentication → Sign In / Providers, turn on email confirmations, and add `https://rudbdhduebejdjdvdj-rgb.github.io/ChillFrog/` to the Auth URL Configuration redirect allow list. The frontend sends a one-time magic link; email addresses remain private and public profiles use an automatically generated Froggy ID.
2. Configure CAPTCHA / abuse protection before opening public posting.
3. Add the owner's auth user ID to `public.community_moderators` from the Supabase SQL editor. Moderators can approve/reject posts and manage events, polls and missions.
4. Configure a trusted Solana transaction indexer and a server-side API secret before populating `public.token_buyer_leaderboard`. Do not calculate buyer rankings from holder counts or user-submitted claims.
5. Add real moderation rules and an abuse-report response process before public launch.

## Data integrity
- Posts default to `pending`; public feed shows approved posts only.
- RLS is enabled on community tables; community-media is a private bucket.
- Community points derive from approved posts and missions, never token purchases.
- Missing market metrics remain unavailable; they are not estimated.
- Never promise investment returns or financial rewards.

## Free-plan operations
Supabase Free can pause projects after prolonged inactivity and does not include downloadable database backups. Check project health before major campaigns and keep migrations backed up in Git.
