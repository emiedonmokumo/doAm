# DoAm

DoAm helps people turn everyday local needs into nearby tasks. A poster sets a runner fee and estimated expenses, a nearby runner claims the task, both people coordinate in context, complete the work, and build reputation.

## What it includes

- Mobile-first task creation, nearby runner discovery, and privacy-safe location labels
- Authenticated profiles, location onboarding, task messaging, notifications, and participant ratings
- Server-authoritative task lifecycle: posted, claimed, pickup/drop-off milestones, proof, and PIN-confirmed completion
- PostgreSQL task storage and server-side radius matching through Prisma-backed services
- Google Maps integration with a usable nearby-list fallback when a map key is unavailable
- Cloudinary-ready image handling; payment remains intentionally off-platform for the MVP

## Technology

Next.js App Router, TypeScript, Tailwind CSS, Auth.js, Prisma ORM, PostgreSQL, Google Maps Platform, Cloudinary, Zod, and Vitest.

## Local setup

1. Use a supported Node LTS release (Node 22 is recommended).
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `AUTH_SECRET`, and any enabled provider credentials.
3. Install dependencies with `npm install`.
4. Run `npm run db:migrate`.
5. Start the application with `npm run dev`.

Without `GOOGLE_MAPS_API_KEY`, discovery remains available in list mode and clearly indicates that map setup is incomplete.

## Useful commands

- `npm run dev` — run the development server
- `npm run lint` / `npm run typecheck` — static quality checks
- `npm run test` — business-logic and API tests
- `npm run db:migrate` — apply Prisma migrations
- `npm run build` — create the production build

## Deployment

DoAm is a standard Next.js application and can run on Vercel, Netlify, or any platform that supports Node.js and PostgreSQL. Set production environment variables in the host and deploy schema changes with `npm run db:deploy` before serving the release.

The GitHub Actions workflow replays all migrations against a clean PostgreSQL Alpine service on each pull request update targeting `dev` or `main`. A push to either branch (including a merged pull request) applies migrations to that branch’s GitHub environment. Create a GitHub Actions environment named `development` restricted to the `dev` branch and another named `production` restricted to `main`; add a secret named `DB_URL` to each environment. Set each secret to that environment’s Supabase **Session Pooler** connection URI from its Connect panel. Use the supplied pooler host and username, URL-encode reserved characters in the password, and require SSL. Do not use the Transaction Pooler URI for Prisma migrations.

For the application runtime, set `SUPABASE_CA_CERT` to the Supabase CA certificate PEM to verify the PostgreSQL TLS connection.

The Task MVP does not currently define a scheduled maintenance/expiry endpoint; do not configure a cron job until that endpoint is implemented.

Do not expose database, Cloudinary secret, or OAuth credentials to the browser. Google Maps browser keys must be restricted by domain and enabled APIs.
