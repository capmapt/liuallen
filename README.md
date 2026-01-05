# liuallen.com - Allen Liu (Min Liu)

Personal website for Allen Liu (Min Liu): AI/VC ecosystem builder, SVTR founder, and AI infrastructure + venture operator. The site is a single-page Next.js export hosted on Cloudflare Pages with a serverless contact endpoint using Pages Functions and MailChannels.

## Cloudflare Pages settings
- **Root directory:** `.` (repository root; includes the `functions/` folder for the contact API)
- **Build command:** `pnpm install --frozen-lockfile && pnpm --filter web build`
- **Output directory:** `apps/web/out`

Environment variables to set in Cloudflare Pages (Project Settings -> Environment Variables):
- `CONTACT_TO_EMAIL` - destination inbox for contact form messages (required)
- `CONTACT_FROM_EMAIL` - sender email to use with MailChannels (required)
- `TURNSTILE_SECRET` - Turnstile secret key for server-side verification (optional but recommended)
- `TURNSTILE_SITEKEY` - Turnstile site key (optional; pairs with `NEXT_PUBLIC_TURNSTILE_SITEKEY`)
- `NEXT_PUBLIC_TURNSTILE_SITEKEY` - expose the site key to the client so the widget renders (optional)

## Local development
```bash
pnpm install
pnpm --filter web dev
```
The site runs at `http://localhost:3000`. The contact form will attempt to POST to `/api/contact`; you can test locally with Wrangler's Pages dev server or stub the endpoint by running `pnpm wrangler pages dev` from the repo root.

Build locally to mirror Cloudflare Pages:
```bash
pnpm --filter web build
```
The static export lands in `apps/web/out`.

## Contact endpoint (`/api/contact`)
- Lives in `functions/api/contact.ts` and runs as a Cloudflare Pages Function.
- Validates name/email/message, enforces Turnstile verification when keys are provided, and applies a best-effort in-memory rate limit when Turnstile is absent.
- Sends mail via MailChannels using `CONTACT_FROM_EMAIL` as the sender and `CONTACT_TO_EMAIL` as the recipient. If sending fails, the response includes a helpful error message.
- Optional Turnstile widget is rendered on the client when `NEXT_PUBLIC_TURNSTILE_SITEKEY` is set; otherwise requests rely on rate limiting.

## My Daily app (MailChannels scheduler)
The My Daily app at `/apps/my-daily` is backed by a dedicated Cloudflare Worker with Cron + D1 storage.

Setup overview:
- Create a D1 database (e.g. `my-daily`) and apply `migrations/0003_my_daily.sql`.
- Deploy the worker from `apps/my-daily-worker` (see `apps/my-daily-worker/wrangler.toml`).
- Add environment variables for the worker:
  - `MAILCHANNELS_API_KEY` (required)
  - `MY_DAILY_FROM_EMAIL` (default `hello@liuallen.com`)
  - `MY_DAILY_REPLY_DOMAIN` (default `liuallen.com`)
- Add a MailChannels Domain Lockdown record:
  - TXT `_mailchannels` → `v=mc1 auth=liuallen`
- Ensure SPF includes MailChannels:
  - `v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net -all`
- Email Routing: point `reply+*@liuallen.com` to the worker email handler if you want to capture replies.

The app reads the API base from `?api=` query param or defaults to `https://api.liuallen.com/my-daily`.

## Updating links and content
- **Scheduling link**: update the Calendly URL in `apps/web/pages/index.tsx` and `apps/web/pages/contact.tsx`.
- **Writing links**: replace the placeholder writing items in `apps/web/pages/index.tsx` (search for `Latest writing`) with real post links.
- **Projects**: edit the "Selected projects" cards in `apps/web/pages/index.tsx` to point to live URLs (or remove placeholders).

## Routing and domains
- `_redirects` ensures `www.liuallen.com` redirects to `https://liuallen.com` and that any unknown route falls back to `/index.html` (useful for SPA-style navigation).
- Set the primary custom domain to `liuallen.com` in Cloudflare Pages. If additional redirects are needed, you can also configure them in the Cloudflare dashboard (Pages Redirect Rules or Bulk Redirects) mirroring the `_redirects` file.

## Ensuring production access
- The production URL should be `https://liuallen.com`. Confirm DNS points to Cloudflare Pages and SSL is active. Test the live site plus `/api/contact` after setting environment variables.
- Preview URLs such as `https://<hash>.liuallen.pages.dev` (for example, `https://dd4408de.liuallen.pages.dev`) can return 404 if branch previews are disabled, the project is configured for a custom domain only, or if Access policies restrict unauthenticated visitors. Enable branch previews in the Pages project settings and remove Access restrictions (or add viewer policies) to make preview links reachable. The canonical deployment target remains the apex domain, so the apex domain should still load even when a hash-based preview link does not.
