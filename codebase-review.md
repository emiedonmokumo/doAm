# Codebase review

## Task consolidation status

The application now uses `Task` as its only work-item model; DoAm remains the product brand. Legacy DoAm pages, APIs, services, and Prisma models are removed by the forward migration. The established library layout is `lib/services/` for task behavior and policy, `lib/validation/` for Zod schemas, `lib/repositories/` for location queries, and `lib/providers/` for external integrations. Do not reintroduce a parallel `lib/domains/` tree.

This review began as an assessment before Task consolidation. The status at the top of this document reflects the current architecture; the baseline and rollout notes below preserve the rationale and product requirements from that review and should not be treated as a current file map.

The audit also calls out existing work to preserve: the supplied logo, DoAm brand language, mobile navigation, and opportunity-focused UI. I’d adapt those foundations rather than replace the product’s identity.

## Pre-consolidation baseline and gaps

- **Task creation:** [create/page.tsx](/home/emiedonmokumo/Projects/do-am/app/(app)/create/page.tsx) collects a title, one reward, a broad category, and one location. The schema in [doam.ts](/home/emiedonmokumo/Projects/do-am/lib/validation/doam.ts) supports drafts, recurrence, and multiple participants, but has no expense estimate, settlement method, pickup/drop-off pair, or task-specific category enum. The LocationPicker uses Google Maps, and configuration is documented in `.env.example` and `README.md`.

- **Discovery and claiming:** [explore/page.tsx](/home/emiedonmokumo/Projects/do-am/app/(app)/explore/page.tsx) fetches a general feed, while [api/doams/route.ts](/home/emiedonmokumo/Projects/do-am/app/api/doams/route.ts) queries broadly by status, category, and search. The API supports a cursor, but the screen requests a fixed batch. There is no required radius filter or atomic first-claim operation: people express interest, then the poster selects an applicant.

- **Execution:** [services/doams.ts](/home/emiedonmokumo/Projects/do-am/lib/services/doams.ts) enforces a generic status graph and writes status history, but the detail page offers broad “Start” and “Mark completed” controls. It has no pickup/drop-off milestones, proof submission, or poster-only PIN.

- **Messaging and social features:** The detail page includes comments, likes, saves, helper selection, ratings, and a link to a conversation. These are established behaviors in the current product. The spec audit says to preserve behavior that satisfies the product spec and to remove the Supabase-only layer only after its replacement works. The Task Protocol request proposes reducing chat friction, but does not by itself establish that every existing social or multi-helper behavior should be removed.

- **Location and privacy:** `publicDoAm` rounds public coordinates, which is a useful safeguard. The detail API calculates helper distance locally, but there is no location repository or nearby feed query. A single `Location` per DoAm cannot represent separate pickup and drop-off points.

- **Security and resilience:** Server-side authorization exists in parts of the task service, but the status endpoint accepts a general next status, and sensitive inputs have no visible rate limiter. PIN attempts will need server-enforced throttling and careful failure responses. Map selection has a fallback when reverse geocoding fails, but its provider is currently Google Maps.

## Current project organization

```text
app/
  (app)/
    tasks/
      new/page.tsx
      radar/page.tsx
      [taskId]/page.tsx
    messages/                 # retain during transition
  api/
    tasks/route.ts
    tasks/[taskId]/
      claim/route.ts
      events/route.ts
      proof/route.ts
      settle/route.ts

features/
  task-creation/
    components/
    schemas.ts
    types.ts
  radar/
    components/
    queries.ts
  task-execution/
    components/
    transitions.ts
    schemas.ts
  settlement/
    components/
    schemas.ts

lib/
  services/
    tasks.ts
    task-policy.ts
  repositories/
    location.ts
  validation/
    tasks.ts
  providers/
    proof-storage/
```

Route handlers should authenticate, parse input, call a domain service, and return structured errors. The domain service should own authorization, transition rules, and transactions; the repository should own Prisma queries and geospatial SQL. Keep map rendering behind a client-only component boundary so browser APIs do not run during SSR. React Hook Form with Zod would fit the structured creation form; TanStack Query is optional if client-side cache and mutation coordination become useful.

## Original Task workflow requirements

### A. Create a task

Use a guided form with:

1. A fixed category choice: Pickup/Delivery, Queueing, Favor, or Quick Repair.
2. Runner fee and estimated expenses as separate amounts.
3. Cash on Delivery or Direct Transfer as a settlement instruction.
4. Pickup and drop-off selection, with address search and graceful geocoding fallback.
5. A server-generated 4-digit handshake PIN stored in a protected form, returned only to the poster, and never included in public task/feed responses.

On submit, create the task as `POSTED` and write its initial event in the same transaction. Before implementation, define whether each task type requires both locations and whether estimated expenses can change after posting.

### B. Radar and claiming

Build a runner feed that requires the runner’s current or saved approximate location, applies a configured radius, and returns distance, category, runner fee, estimated expenses, and settlement method. A “Claim job” command should atomically lock the task to the first eligible runner; later claims receive a clear conflict response. The server must enforce radius, status, and ownership rules rather than trusting the client.

### C. Milestone execution

Show a role-aware stepper and one primary action for the current state:

`CLAIMED → EN_ROUTE_PICKUP → ARRIVED_PICKUP → PROOF_SUBMITTED → EN_ROUTE_DROPOFF → ARRIVED_DROPOFF`

Proof submission should validate upload type and size, authorize the assigned runner, and record an event with the status change. Keep proof storage behind the existing Cloudinary adapter boundary or another replaceable provider.

### D. Settlement and reputation

After in-person handover, the runner submits the PIN. The server validates it, applies a strict per-task and per-runner attempt limit, records a settlement event, and marks the task `COMPLETED`. Only successful completion should update both users’ trust metrics. The PIN should be hashed at rest, excluded from logs and event payloads, and shown only to the task poster.

## Original schema and migration direction

The current `DoAmStatus` and `DoAm` model do not map cleanly to the proposed protocol. I recommend introducing a distinct Task domain with typed category and payment enums; runner fee and expense estimate fields; pickup and drop-off locations; assigned runner; hashed handshake PIN; proof metadata; and explicit milestone status. Persist immutable task events containing actor, type, timestamp, and safe metadata. Keep legacy DoAm records and routes readable while the new workflow is introduced, then decide their disposition after the replacement has been verified.

The location suggestion (Leaflet, OpenStreetMap, and Nominatim) conflicts with the audit’s current Google Maps direction, and the spec says external providers should remain replaceable. Treat the provider change as an explicit product/operations decision. A provider interface makes either choice possible; Nominatim also needs an appropriate request policy and graceful fallback.

## Original rollout plan (superseded)

1. Confirm Task Protocol policy choices: radius default, proof requirements per category, transfer confirmation semantics, PIN retry limits, and whether multi-person tasks remain supported.
2. Add the new Task schema and Prisma migration without deleting existing DoAm or messaging behavior.
3. Implement domain services and repositories for creation, radar queries, atomic claiming, milestone events, and settlement.
4. Add the guided creation, radar, and task action-controller screens using existing DoAm visual language.
5. Verify authorization, transition rules, location privacy, and migration behavior before retiring overlapping legacy flows.

This is an evaluation and proposed organization; I have not changed files.