# DigitalDot Reporting Dashboard

Private client reporting portal for Google Ads, GA4, and Meta Ads. V1 ships a complete admin and client dashboard experience with deterministic mock reporting data behind server-only service functions.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Recharts
- Prisma + PostgreSQL
- Env-backed admin login
- Secret-link client report access
- CloudPanel/PM2 deployment workflow

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`.

3. Generate an admin password hash:

```bash
npm run hash-password -- "your-password"
```

4. Run migrations and seed the demo client:

```bash
npm run db:dev
npm run db:seed
```

The seed prints a one-time demo report link if the demo client did not already have a share token.

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000/admin/login`.

## Environment Variables

- `DATABASE_URL`: Postgres connection string.
- `AUTH_SECRET`: long random value used to sign admin and client cookies.
- `ADMIN_USERNAME`: admin login username.
- `ADMIN_PASSWORD_HASH`: generated with `npm run hash-password`.
- `NEXT_PUBLIC_APP_URL`: public app URL used when generating client share links.

Google Sheets, GA4, and Meta variables are included in `.env.example` for the later live connector phases. V1 does not call those APIs.

## Access Model

Admin access uses one env-configured account and an HttpOnly signed cookie.

Client reports use secret links:

```txt
/client/[slug]/report?token=<raw-token>
```

The token is exchanged server-side for a scoped HttpOnly report cookie, then the user is redirected to the clean report URL. Regenerating a link invalidates the previous raw token.

## Data Sources

V1 uses mock data only, but keeps the real response contract:

- Google Ads block is present when `googleAdsSheetUrl` is configured.
- GA4 block is present when `ga4PropertyId` is configured.
- Meta block is present when `metaAdAccountId` is configured.
- Missing source configuration returns a safe `missing_config` status and an empty UI state.

Future connector implementations should replace the mock service without changing the dashboard response shape.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Playwright specs are included for browser checks. Run them after a database is configured and seeded:

```bash
npm run e2e
```

## CloudPanel Deployment

The GitHub workflow deploys `main` over SSH, installs dependencies, runs Prisma generate and migrations, builds Next.js, then restarts PM2 on port `3000`.

Required production setup:

- Set all env vars in the CloudPanel site environment.
- Ensure the Postgres database is reachable from the server.
- Run `npm run db:seed` once if you want the demo client.
- Generate real client share links from `/admin/clients/[slug]`.

## Later Connector Phases

- Google Ads: read standardized Google Sheet tabs server-side with service account credentials.
- GA4: fetch Data API reports server-side using `ga4PropertyId`.
- Meta: fetch Ads Insights server-side using `metaAdAccountId`.

All external credentials must remain server-only and must never appear in browser bundles or API responses.
