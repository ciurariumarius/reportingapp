# DigitalDot Reporting Dashboard

Private client reporting portal for Google Ads, GA4, and Meta Ads. V1 ships a complete admin and client dashboard experience with deterministic mock reporting data behind server-only service functions.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Recharts
- Prisma + MySQL
- Env-backed admin login
- Public noindex client report links
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

The seed creates a demo client that can be opened at `/r/digitaldot-demo`.

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000/admin/login`.

## Environment Variables

- `DATABASE_URL`: MySQL connection string.
- `AUTH_SECRET`: long random value used to sign admin and client cookies.
- `ADMIN_USERNAME`: admin login username.
- `ADMIN_PASSWORD_HASH`: generated with `npm run hash-password`.
- `NEXT_PUBLIC_APP_URL`: public app URL used when generating client share links.

Google Sheets, GA4, and Meta variables are included in `.env.example`. GA4 and Meta are fetched server-side when their credentials and client IDs are configured.

## Access Model

Admin access uses one env-configured account and an HttpOnly signed cookie.

Client reports use public noindex links:

```txt
/r/[slug]
```

Anyone with the report link can view the report. Report pages send noindex/nofollow metadata and headers, but this is not authentication.

## Data Sources

Google Ads still uses the generated Google Sheet flow. GA4 and Meta can be connected live through their server-side APIs.

- Google Ads block is present when `googleAdsSheetUrl` is configured.
- GA4 block is live when `ga4PropertyId`, `GA4_CLIENT_EMAIL`, and `GA4_PRIVATE_KEY` are configured.
- Meta block is live when `metaAdAccountId` and `META_ACCESS_TOKEN` are configured.
- Missing source configuration returns a safe `missing_config` status and an empty UI state.

Future connector changes should preserve the dashboard response shape.

## GA4 Setup

1. Enable the Google Analytics Data API in the Google Cloud project that owns the service account.
2. Create or use a service account.
3. Add the service account email as Viewer or higher in GA4 property access management.
4. In the admin client settings, set `GA4 property ID` to either `123456789` or `properties/123456789`.
5. Set env vars:

```env
GA4_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GA4_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

The GA4 connector fetches:

- daily users, sessions, engaged sessions, engagement rate, event count, key events, revenue
- source/medium performance
- event performance
- landing page performance

## Meta Ads Setup

1. Create or choose a Meta app with Marketing API access.
2. In Business Settings, create or use a System User.
3. Grant that System User access to the ad accounts you want to report on.
4. Generate a System User token with `ads_read`.
5. Set env vars:

```env
META_ACCESS_TOKEN=EA...
META_API_VERSION=v23.0
META_APP_SECRET=
```

`META_APP_SECRET` is optional. When set, server requests include `appsecret_proof`.

In the admin client settings, set `Meta ad account ID` to either `act_123456789` or `123456789`. The app normalizes it to `act_...` internally.

The Meta connector fetches:

- daily account performance
- campaign performance
- action breakdowns
- ecommerce purchase value and ROAS when the client report type is `Ecommerce`

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

The GitHub workflow deploys `main` over SSH, installs dependencies, runs Prisma generate and migrations, builds Next.js, then restarts PM2 on port `3006`.

Required production setup:

- Set all env vars in the CloudPanel site environment.
- Ensure the MySQL database is reachable from the server.
- Keep the CloudPanel site/proxy pointed to `127.0.0.1:3006`.
- Run `npm run db:seed` once if you want the demo client.
- Generate real client share links from `/admin/clients/[slug]`.

## Later Connector Phases

- Google Ads: read standardized Google Sheet tabs server-side with service account credentials.

All external credentials must remain server-only and must never appear in browser bundles or API responses.
