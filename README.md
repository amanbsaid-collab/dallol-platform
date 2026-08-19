# Dallol Platform

Dallol Business Operating System — Next.js application, AI workforce, CRM, automation, payments, and production infrastructure.

## Phase 2: Production infrastructure

- Multi-tenant organization and membership model
- Authentication-ready user, session, account, and verification-token schema
- CRM foundation: contacts, pipelines, stages, and deals
- Workflow and agent execution primitives
- Audit event model for operational traceability
- Database-aware health endpoint
- GitHub Actions quality gate for typecheck, lint, test, and production build

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to a PostgreSQL database.
3. Install dependencies with `npm ci`.
4. Generate the Prisma client with `npx prisma generate`.
5. Apply the schema with `npx prisma migrate dev` when a development database is available.
6. Run `npm run dev`.

## Architecture boundary

Authentication is isolated behind `src/lib/auth.ts`. The application can adopt Auth.js, a managed identity provider, or a future Dallol-native identity service without coupling CRM/workflow code to the provider.

Secrets are never committed. `.env.example` contains placeholders only.
