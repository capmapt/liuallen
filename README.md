# MailDiary

MailDiary is an email-first journaling tool. Users sign in with a magic link, receive scheduled prompts, reply with text or attachments, and browse their archive on the web.

## Architecture

- **Frontend**: Next.js (static export) hosted on Cloudflare Pages at `https://diary.liuallen.com`.
- **API & background work**: Cloudflare Worker (Hono) bound to `https://api.diary.liuallen.com`.
- **Persistence**: Cloudflare D1 for relational data, R2 for attachments, KV for sessions.
- **Email**: MailChannels for transactional mail, Cloudflare Email Routing for inbound replies.
- **Scheduling**: Cron trigger (every 5 minutes) to deliver reminders and generate memory prompts.

## Getting started locally

Requirements: `pnpm`, Node.js 20+, Wrangler.

```bash
cp .env.example .env.local
pnpm install
```

### Run the worker

```bash
pnpm --filter worker dev
```

This starts the Hono API on `http://localhost:8787`. Bindings required for local dev:

```bash
wrangler d1 create maildiary-dev
wrangler d1 execute maildiary-dev --file=./migrations/0001_init.sql
wrangler r2 bucket create maildiary-dev-attachments
wrangler kv namespace create maildiary-dev-sessions
```

Update `wrangler.toml` (or create `wrangler.dev.toml`) with the new binding IDs. When running locally you can also stub MailChannels by logging requests instead of sending.

### Run the web app

```bash
cd apps/web
pnpm dev
```

The site loads at `http://localhost:3000` and proxies API calls to `http://localhost:8787` via `NEXT_PUBLIC_API_BASE`.

## Deployment

### Cloudflare resources

1. **D1**: Create a database (e.g. `maildiary-prod`). Apply migrations:
   ```bash
   wrangler d1 migrations apply maildiary-prod
   ```
2. **R2 bucket**: `maildiary-attachments` for entry uploads.
3. **KV namespace**: `maildiary-sessions` for session storage.
4. **Email Routing**:
   - Add routes for `reminder@diary.liuallen.com` (deliver to MailChannels) and `reply@diary.liuallen.com` (deliver to Worker).
   - Configure a catch-all to Worker if desired.
5. **MailChannels**: ensure SPF/DKIM records exist for `diary.liuallen.com`. Add TXT records suggested in the Cloudflare dashboard. Set envelope sender as `reminder@diary.liuallen.com`.
6. **Cron trigger**: Already defined in `wrangler.toml` (`*/5 * * * *`). Enable after first deploy.

### DNS

- `A`/`CNAME` for `diary.liuallen.com` → Cloudflare Pages project.
- `CNAME`/`AAAA` for `api.diary.liuallen.com` → Worker route via Cloudflare dashboard.
- SPF record example: `v=spf1 include:_spf.mx.cloudflare.net -all`.
- DKIM/DMARC: follow MailChannels guidance; add DKIM CNAMEs and optional DMARC policy.

### Secrets & environment variables

Set via Wrangler / Cloudflare Dashboard:

- `MAILCHANNELS_API_KEY` (if using a dedicated API key; optional for standard integration).
- Override `MAIL_FROM`, `APP_BASE_URL`, `API_BASE_URL`, `COOKIE_DOMAIN` if needed per environment.
- `MAGIC_LINK_EXP_MINUTES` to adjust token TTL.

For GitHub Actions, set repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` (needs permissions: `Workers Scripts`, `Workers KV Storage`, `Pages`, `R2`, `D1` read/write).

### GitHub Actions

- `.github/workflows/deploy-pages.yml` builds the Next.js site (static export) and deploys to Cloudflare Pages project `maildiary-web`.
- `.github/workflows/deploy-worker.yml` type-checks and deploys the Worker via Wrangler.

## Feature flow

1. **Magic link login**: `/auth/magic-link` issues a token and emails it via MailChannels. `/auth/verify` exchanges for a session cookie stored in KV.
2. **Reminder configuration**: Reminders stored in D1 with timezone-aware scheduling.
3. **Cron delivery**: Cron job queries due reminders, generates recall prompts from previous entries, and sends via MailChannels. Replies go to `reply+<userId>@diary.liuallen.com`.
4. **Inbound email**: Email Worker ingests messages, stores metadata in D1, uploads attachments to R2, and surfaces them in the dashboard.
5. **Web app**: Client-side fetches with credentialed requests to list/search entries, manage reminders, pause/unsubscribe, and export JSON.

## TODOs / manual steps

- Populate `wrangler.toml` bindings (`database_id`, `id`) with production resource IDs.
- Configure Email Routing to forward to the Worker and enable DKIM/SPF for MailChannels.
- Upload branding assets and polish UI.
- Add rate limiting / abuse protection for magic link requests.
- Add automated tests and monitoring.
