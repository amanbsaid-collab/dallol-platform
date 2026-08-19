# Syntic Production Agent

The production agent is the execution boundary between Dallol's intelligence layer and its persistent job runtime.

## Flow

1. Authenticated organization member submits an active workflow through `POST /api/syntic/production`.
2. Dallol validates tenant ownership and workflow activation.
3. The request becomes an idempotent `syntic.workflow.execute` job in PostgreSQL.
4. A worker claims the job using the existing lease/retry runtime.
5. Syntic selects an enabled organization agent and produces structured execution intent using `OPENAI_API_KEY`.
6. Mutating plans remain approval-gated unless an authorized caller explicitly enables auto-approval.
7. Every execution/approval boundary is audit logged.

## Environment

Set `OPENAI_API_KEY` in the deployment environment. Never commit the value to Git. The existing Syntic client reads the key lazily at runtime, so builds do not require the secret.

Optional: `SYNTIC_MODEL` selects the configured model; otherwise the repository default is used.

## Operational boundary

The agent does not invent CRM state or claim mutations were applied merely because an LLM proposed them. The current workflow engine and job runtime remain the persistence/execution authorities. This branch adds the production enqueue boundary; worker deployment and concrete external action adapters remain separate infrastructure work.
