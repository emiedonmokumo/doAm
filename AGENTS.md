# DoAm Engineering Rules

## Product contract

DoAm is a mobile-first local opportunity platform: people post everyday needs, nearby people accept them, communicate, complete the work, and build reputation. Preserve the supplied DoAm logo and established brand language. Do not turn the product into a job board, freelancer marketplace, wallet, or social-media clone.

## Safe delivery

- Treat `docs/spec-compliance-audit.md` and the product specification as sources of truth.
- Inspect before changing. If a requirement, data migration, destructive removal, payment, or external-service decision is unclear, ask before acting.
- Preserve every existing screen or behavior that satisfies the specification. Remove code and dependencies only after proving that the replacement works.
- Do not add mock authentication, fake payments, AI dependencies, or client-authoritative security.

## Architecture and security

- Use App Router, TypeScript strict mode, Auth.js, Prisma migrations, Zod validation, and server-side services/repositories.
- All state-changing operations require authenticated server-side authorization, ownership/participant checks, input validation, structured errors, and appropriate rate limits.
- Keep geospatial SQL in the location repository. Never expose exact home addresses or precise public coordinates.
- Keep external providers behind narrow adapters: Google Maps, Cloudinary, scheduled jobs, and notifications must be replaceable.

## Quality and operations

- Build mobile-first, accessible, responsive UI with loading, empty, error, and success states.
- Add or update automated tests for business rules and authorization whenever behavior changes.
- Keep deployments platform-neutral: document environment variables, migrations, seed data, and cron behavior; do not couple core application code to one host.
- Before handoff run formatting, linting, type checks, tests, database migration/seed verification, and a production build when the environment allows.
