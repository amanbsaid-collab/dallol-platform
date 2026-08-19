# Dallol Production Architecture

## Deployed topology

- Next.js/Vercel: public application and authenticated API surface.
- Managed PostgreSQL: authoritative application, workflow, agent, audit, and durable job state.
- Dedicated Syntic worker: long-running PostgreSQL-backed job consumer using leases and retries.
- GitHub Actions: CI validation and Prisma migration verification.

## Service boundaries

Browser -> Vercel -> PostgreSQL
Vercel -> PostgreSQL (enqueue/read state)
Worker -> PostgreSQL (claim/execute/update jobs)
Syntic -> approved tools/CRM/workflows

## Required production environment

Vercel:
- DATABASE_URL
- OPENAI_API_KEY
- AUTH_SECRET (or project-specific auth secret)

Worker:
- DATABASE_URL
- WORKER_ID
- OPENAI_API_KEY when model invocation is enabled in the worker

GitHub Actions:
- DATABASE_URL only when running against a non-ephemeral migration target; CI uses an ephemeral PostgreSQL service.

Secrets must be configured in the provider secret stores and never committed to the repository.

## Job lifecycle

QUEUED -> RUNNING (lease) -> SUCCEEDED
                         \-> FAILED -> retry -> DEAD_LETTER

Idempotency is enforced by the PostgreSQL unique constraint on organizationId + idempotencyKey.
Leases are stored on Job. An expired RUNNING lease is eligible for reclamation by another worker.

## Deployment sequence

1. Provision managed PostgreSQL.
2. Set DATABASE_URL in Vercel and worker service.
3. Set OPENAI_API_KEY and auth secret in Vercel; set OpenAI key in worker if required.
4. Run `npx prisma migrate deploy` during deployment.
5. Deploy Next.js to Vercel.
6. Build and deploy `worker/Dockerfile` to a dedicated always-on worker service.
7. Set WORKER_ID per worker instance.
8. Verify health, enqueue a unique test job, observe worker claim, and verify final PostgreSQL state.

## Verification checklist

- [ ] Vercel deployment healthy
- [ ] Worker process healthy
- [ ] PostgreSQL reachable from both services
- [ ] Prisma migrations current
- [ ] Unique idempotency constraint present
- [ ] Worker lease written and cleared
- [ ] Retry and dead-letter behavior verified
- [ ] Syntic execution audited
- [ ] No secrets committed
