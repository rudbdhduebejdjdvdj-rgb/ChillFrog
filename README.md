# ChillFrog

ChillFrog is a lightweight static community site hosted on GitHub Pages.

## Frontend features
- Compact CFROG market card powered by the Jupiter Tokens API v2.
- Jupiter swap plugin with the official CFROG mint fixed as output.
- Local meme generator: images stay in the browser and export as PNG.
- Community hub UI for guest profiles, moderated posts, reactions, polls, events, missions, and community points.
- Separate on-chain buyer leaderboard, populated only by a trusted server-side indexer.

## GitHub Pages
In Settings → Pages, select Deploy from a branch, branch `main`, folder `/(root)`.

## Supabase setup (required before enabling community features)
1. Create a dedicated Supabase project named `ChillFrog`. Do not reuse the inactive Revora project.
2. Apply `supabase/migrations/20261126000100_chillfrog_community.sql`.
3. Enable anonymous sign-ins in Supabase Auth. Add CAPTCHA / abuse protection before opening submissions publicly.
4. Copy the project URL and publishable key into `community-config.js`. Only the publishable key belongs in the browser; never add a secret/service-role key to GitHub.
5. Add the first moderator's auth user ID to `public.community_moderators` using the Supabase dashboard. The first moderator can then approve posts and manage published events, polls and missions.
6. Set up the Birdeye API key as a Supabase Edge Function secret before deploying the on-chain buyer sync. Never expose it in client-side code.

## Data integrity and safety
- Community posts default to `pending` and are not publicly visible until approved.
- RLS is enabled on exposed community tables and the media bucket is private.
- Guest profiles use a public nickname only; do not collect emails, real names, wallet recovery phrases or contact details.
- Community points are based on approved contributions and missions, not token purchases.
- The buyer leaderboard must be computed from verified buy transactions, not holder counts.
- Market data may be unavailable if Jupiter has not indexed the token. Missing data is displayed as unavailable rather than estimated.
- This project is not investment advice. Never promise returns or financial rewards.
