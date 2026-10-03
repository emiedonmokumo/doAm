# Repository Agent Rules

## 1. Local Execution

Do not run terminal commands, tests, lint, type checks, builds, package installs, database migrations, or development servers unless the user explicitly asks for them in the current request.

The user is responsible for running and verifying:

* Tests
* Lint
* Type checks
* Builds
* Development servers
* Database migrations
* Package installation

Never inspect, modify, or delete files under:

* `.next/`
* `node_modules/`

For application walkthroughs, use an already available browser session.

Do not start a development server unless the user explicitly permits it.

When command execution is not permitted:

* Inspect source and configuration directly.
* Distinguish verified facts from unverified behaviour.
* Do not claim that tests, builds, or runtime behaviour were verified.

---

## 2. Understand Before Changing

Before modifying the codebase:

1. Understand the user's request and expected behaviour.
2. Inspect the relevant source files and existing implementation.
3. Identify existing components, services, repositories, providers, validation schemas, utilities, and patterns that can be reused.
4. Check whether the requested functionality already exists partially or completely.
5. Follow existing project conventions instead of introducing new patterns unnecessarily.

Do not make unrelated changes.

Do not modify files simply to improve them unless the change is necessary for the requested task.

---

## 3. Git and Branch Safety

Do not switch branches, create branches, merge branches, rebase, reset, discard changes, force-push, delete branches, commit, or push changes unless explicitly requested by the user.

Never overwrite or discard existing user changes.

Do not assume the current branch is safe for a particular task.

---

## 4. Next.js and TypeScript

This is a Next.js application using:

* TypeScript
* App Router
* React
* Server Components by default

Follow the existing Next.js architecture and project conventions.

### Server Components

Prefer Server Components by default.

Only use:

```tsx
"use client";
```

when the component actually requires client-side functionality such as:

* React state
* Event handlers
* Browser APIs
* Client-only libraries
* Client-side effects

Keep Client Component boundaries as small as practical.

### Data Fetching

Prefer server-side data fetching when appropriate.

Reuse existing services, repositories, and data-access functions.

Do not create API endpoints merely to fetch data that can safely be retrieved directly from a Server Component or Server Action.

### Route Handlers

Use Route Handlers when an HTTP endpoint is actually required.

Follow existing conventions for:

* Authentication
* Authorisation
* Validation
* Error handling
* Response formats
* Status codes

### Server Actions

Use Server Actions where they fit the existing architecture.

Validate all untrusted input on the server.

Never rely solely on client-side validation.

---

## 5. Project Architecture

Follow these project boundaries:

```text
lib/services/      → business operations
lib/validation/    → request/input schemas
lib/repositories/  → persistence and database queries
lib/providers/     → external provider integrations
```

Keep business logic out of route handlers and UI components when it belongs in a service.

Keep persistence queries out of services when the repository layer already provides the appropriate abstraction.

Keep external provider-specific logic inside `lib/providers/`.

Reuse existing abstractions before creating new ones.

---

## 6. Product and Domain Conventions

Preserve **DoAm** as the product brand.

Use **Task** as the work-item/domain name.

Do not reintroduce a parallel DoAm data model when the existing Task model already represents the work item.

Follow existing domain terminology consistently across:

* Database models
* Types
* Services
* API responses
* Components
* Validation
* Documentation

---

## 7. TypeScript Rules

Never use `any`.

This includes explicit annotations and casts such as:

```typescript
any
```

or:

```typescript
value as any
```

Prefer concrete types.

When the type is genuinely unknown, use:

```typescript
unknown
```

and narrow it through validation or type guards.

Avoid unnecessary type assertions.

Do not silence TypeScript errors merely to make the code compile.

Prefer types that accurately represent the underlying domain and runtime data.

---

## 8. Database and Prisma Safety

Use forward-only Prisma migrations.

Never rewrite or modify historical migrations that have already been created or applied.

Create a new migration for schema changes.

Do not run migrations against any database unless the user explicitly authorises that operation.

Treat destructive schema or data changes as requiring an explicit data-retention decision before implementation.

Do not:

* Drop data without explicit approval.
* Delete columns without considering existing data.
* Rename database fields in a way that loses existing data.
* Reset a database without explicit authorisation.

Clearly identify the potential data impact of destructive changes.

---

## 9. Dependency Management

Apply these rules to **all application and development dependencies**, including packages used by:

* Application code
* Components
* Services
* Tests
* Configuration
* Build tooling
* Scripts
* Development tooling

Before removing or changing a dependency:

1. Trace its imports and call sites.
2. Check reusable components and shared modules.
3. Check tests.
4. Check configuration files.
5. Check scripts and tooling.
6. Check indirect usage where relevant.

Do not infer that a package is unused simply because no route imports it directly.

Preserve shared UI wrappers and their dependencies unless their removal is intentional and all references are updated.

Before adding a dependency, determine whether the existing project already provides equivalent functionality.

For peer dependency conflicts:

* Use versions that officially support the application's React and Next.js versions.
* Do not use `--force`.
* Do not use `--legacy-peer-deps` as a substitute for resolving the underlying version conflict.

Keep `package.json` and the package lockfile in sync when dependency changes are explicitly made.

Do not claim that installs or CI are reproducible when the lockfile is missing or stale.

---

## 10. Security

Treat all external and client-provided input as untrusted.

Consider:

* Authentication
* Authorisation
* Input validation
* Data ownership
* Role and permission checks
* Injection risks
* XSS
* Sensitive information exposure

Never expose server-only secrets to Client Components.

Never expose secrets through:

```text
NEXT_PUBLIC_*
```

Do not commit credentials, API keys, tokens, or private configuration.

Do not log passwords, tokens, API keys, or other sensitive information.

---

## 11. Error Handling

Follow the project's existing error-handling conventions.

Errors should:

* Be handled at the appropriate layer.
* Provide useful debugging information where appropriate.
* Avoid exposing sensitive implementation details.
* Use appropriate HTTP status codes.
* Provide useful user-facing messages where necessary.

Do not silently swallow errors.

Avoid empty catch blocks unless the behaviour is intentional and there is a clear reason for them.

---

## 12. Scope Control

Keep changes focused on the requested task.

Do not:

* Refactor unrelated code.
* Rename unrelated files.
* Reformat unrelated files.
* Upgrade dependencies unnecessarily.
* Rewrite working code without a reason.
* Introduce new architectural patterns without justification.
* Remove code merely because it appears unused without verifying its usage.

Prefer the smallest clean change that correctly solves the problem.

---

## 13. Documentation

Update documentation when the change affects:

* Public APIs
* Environment variables
* Setup instructions
* Developer workflows
* Architecture
* Significant configuration
* Important user-facing behaviour

Do not create unnecessary documentation for small internal changes.

---

## General Principles

* Understand before changing.
* Follow existing project conventions.
* Reuse existing abstractions.
* Keep changes focused.
* Prefer simple solutions.
* Do not over-engineer.
* Do not introduce unnecessary dependencies.
* Do not make unrelated changes.
* Protect existing user changes.
* Treat database changes carefully.
* Treat external input as untrusted.
* Never perform destructive operations without explicit authorisation.
* Never claim something was tested or verified when it was not.
* The user handles test, build, lint, type-check, server, and migration execution unless explicitly requested otherwise.
