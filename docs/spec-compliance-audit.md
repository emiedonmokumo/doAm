# DoAm Specification Compliance Audit

## Audit date

2026-08-24

## Findings before the alignment work

The original implementation established a polished mobile-oriented visual prototype and several useful domain tables, but it did not satisfy the product's production architecture or safety requirements.

| Area | Finding | Risk / required correction |
| --- | --- | --- |
| Authentication and data access | Browser components use Supabase Auth and direct database queries/mutations. | Replace with Auth.js, Prisma, server services, validation, authorization, and structured API errors. |
| Database workflow | `prisma/schema.prisma` exists, but migrations are raw SQL under `supabase/migrations`; there is no Prisma migration history or seed script. | Adopt a Prisma-owned PostgreSQL/PostGIS schema, migrations, and fictional Nigerian development seed. |
| Opportunity lifecycle | Acceptance, status changes, notifications, conversations, and ratings are separate client writes. | Make lifecycle commands transactional and enforce transition/participant/capacity rules on the server. |
| Current RLS interactions | The client attempts cross-user notification and profile-rating writes while current RLS limits those writes; a taker also cannot update an opportunity owned by its requester. | Move these operations to the server and remove the obsolete Supabase-only access layer after replacement verification. |
| Discovery and maps | The map view is a coordinate layout; feed filtering is client-side and not paginated despite a PostGIS function existing. | Use a dedicated proximity repository and Google Maps provider with clustering, search, radius, and a list fallback. |
| Privacy | Opportunity latitude/longitude can be loaded into the browser; exact address handling is not centrally controlled. | Store precise coordinates privately and return rounded public marker coordinates and approximate labels only. |
| Product completeness | Image upload, map provider, report/block UI and enforcement, recurring processing, batching of nearby notifications, and completed-work profile history are absent or incomplete. | Implement the MVP/P1 paths behind server APIs and provider boundaries. |
| Engineering quality | No tests, `.env.example`, Prettier configuration, seed workflow, robust API errors, or rate limits. Next build ignores ESLint and images are globally unoptimized. | Add test/tooling baseline, remove build lint suppression, optimize images, and verify production commands. |
| Platform portability | The project contains a Netlify plugin/config but no deployment-neutral operational documentation. | Keep standard Next.js Node deployment as the baseline and document optional host cron/migration setup. |

## Preserved work

The supplied logo assets, DoAm brand colors, mobile navigation shape, landing language, and lightweight opportunity-centric UI are retained as design inputs. Payment escrow, wallet functionality, AI dependency, native applications, and complex real-time infrastructure remain out of scope.
