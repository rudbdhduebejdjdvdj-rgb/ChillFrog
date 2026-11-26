# ChillFrog

Lightweight static community site hosted on GitHub Pages.

## Frontend
- Compact CFROG live market card via Jupiter Tokens API v2 (60-second refresh).
- Dedicated pages: `the-swamp.html` for community and `create.html` for the meme studio.
- Jupiter swap widget with the official CFROG mint.
- Local meme generator with PNG export; uploaded source images remain in the browser.
- Supabase community: private email magic-link sign-in, automatically generated public IDs, moderated posts, likes, reports, polls, events, missions and contributor leaderboard.
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
1. Email passwordless sign-in is implemented but deliberately disabled until launch requirements are met. Supabase default SMTP only sends to organization team addresses and is limited to 2 emails/hour. Configure custom SMTP, verify the sender domain (SPF/DKIM/DMARC), enable Email and email confirmations, and allow these redirects: `https://rudbdhduebejdjdvdj-rgb.github.io/ChillFrog/`, `https://rudbdhduebejdjdvdj-rgb.github.io/ChillFrog/the-swamp.html`, and `https://rudbdhduebejdjdvdj-rgb.github.io/ChillFrog/create.html`. Create a Cloudflare Turnstile widget, enter its secret in Supabase Auth → Bot and Abuse Protection, put its public site key in `community-config.js`, and set `emailAuthReady: true` only after testing. The frontend sends a one-time magic link; email addresses remain private and public profiles use an automatically generated Froggy ID.
2. Configure CAPTCHA / abuse protection and a custom SMTP sender before public launch. Supabase's default email sender is intended for low-volume testing, not dependable production delivery.
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


## Team & private HQ
- Public team directory: `team.html` (profiles are shown only when active and approved for public display).
- Private admin workspace: `hq.html` (email magic-link login; only UUIDs provisioned in `public.team_admins` can access it).
- Team data is stored in the ChillFrog Supabase project with RLS enabled. Admins can manage profiles, tasks and contribution records. No service-role key is exposed in the browser.
- Before enabling HQ sign-in, configure custom SMTP and CAPTCHA in Supabase Auth, test the email flow, then set `emailAuthReady: true` in `community-config.js`.
- To provision the two administrators: each person must sign in once after email auth is enabled. In Supabase SQL Editor, find their auth user UUIDs in Authentication → Users and insert them into `public.team_admins` with roles `founder` and `co_founder`. Never allow users to assign themselves admin roles.
