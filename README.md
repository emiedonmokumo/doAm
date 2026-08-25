# DoAm

DoAm helps people turn everyday local needs into opportunities. A requester posts a task with a reward, nearby community members discover and accept it, both people communicate in context, complete the work, and build reputation.

## What it includes

- Mobile-first opportunity creation, nearby discovery, and privacy-safe map markers
- Authenticated user profiles, location onboarding, social interactions, contextual messaging, notifications, and ratings
- Server-authoritative opportunity lifecycle: draft, published, accepted, in progress, completed, cancelled, and expired
- PostgreSQL/PostGIS proximity queries through Prisma-backed services
- Google Maps integration with a usable nearby-list fallback when a map key is unavailable
- Cloudinary-ready image handling; payment remains intentionally off-platform for the MVP

## Technology

Next.js App Router, TypeScript, Tailwind CSS, Auth.js, Prisma ORM, PostgreSQL/PostGIS, Google Maps Platform, Cloudinary, Zod, and Vitest.

## Local setup

1. Use a supported Node LTS release (Node 22 is recommended).
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `AUTH_SECRET`, and any enabled provider credentials.
3. Install dependencies with `npm install`.
4. Enable the PostgreSQL `postgis` extension on the development database.
5. Run `npm run db:migrate` and `npm run db:seed`.
6. Start the application with `npm run dev`.

Without `GOOGLE_MAPS_API_KEY`, discovery remains available in list mode and clearly indicates that map setup is incomplete.

## Useful commands

- `npm run dev` — run the development server
- `npm run lint` / `npm run typecheck` — static quality checks
- `npm run test` — business-logic and API tests
- `npm run db:migrate` — apply Prisma migrations
- `npm run db:seed` — load fictional Nigerian development data
- `npm run build` — create the production build

## Deployment

DoAm is a standard Next.js application and can run on Vercel, Netlify, or any platform that supports Node.js and PostgreSQL. Set production environment variables in the host, execute `npm run db:deploy` in CI before serving the release, and wire the host scheduler to the protected maintenance endpoint for expiry, recurrence, and batched notifications.

Do not expose database, Cloudinary secret, or OAuth credentials to the browser. Google Maps browser keys must be restricted by domain and enabled APIs.
