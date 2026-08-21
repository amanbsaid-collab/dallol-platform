import { randomUUID } from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import OpenAI from 'openai';

const db = new PrismaClient();

const workerId = process.env.WORKER_ID ?? `syntic-${randomUUID()}`;
const pollMs = Number(process.env.WORKER_POLL_MS ?? 1000);

let shuttingDown = false;

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY_MISSING');
  return new OpenAI({ apiKey });
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function getPath(input: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, input);
}

function conditionMatches(config: Record<string, unknown>, input: unknown) {
  const field = typeof config.field === 'string' ? config.field : '';
  const operator = typeof config.operator === 'string' ? config.operator : 'equals';
  const expected = config.value;
  const actual = getPath(input, field);
  switch (operator) {
    case 'not_equals': return actual !== expected;
    case 'exists': return actual !== undefined && actual !== null;
    case 'contains': return typeof actual === 'string' && actual.includes(String(expected));
    default: return actual === expected;
  }
}

async function executeCrmContact(job: { organizationId: string; payload: Prisma.JsonValue }) {
  const payload = asRecord(job.payload);
  const input = asRecord(payload.input as Prisma.JsonValue);
  const firstName = typeof input.firstName === 'string' ? input.firstName.trim() : '';
  if (!firstName) throw new Error('CRM_CONTACT_FIRST_NAME_REQUIRED');
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : null;
  if (email) {
    const existing = await db.contact.findFirst({ where: { organizationId: job.organizationId, email } });
    if (existing) return { contactId: existing.id, created: false };
  }
  const contact = await db.contact.create({
    data: {
      organizationId: job.organizationId,
      firstName,
      lastName: typeof input.lastName === 'string' ? input.lastName.trim() : null,
      email,
      phone: typeof input.phone === 'string' ? input.phone.trim() : null,
      company: typeof input.company === 'string' ? input.company.trim() : null,
    },
  });
  return { contactId: contact.id, created: true };
}

async function executeWorkflow(job: { organizationId: string; payload: Prisma.JsonValue }) {
  const payload = asRecord(job.payload);
  const workflowId = typeof payload.workflowId === 'string' ? payload.workflowId : '';
  const runId = typeof payload.runId === 'string' ? payload.runId : '';
  const input = payload.input ?? {};
  if (!workflowId || !runId) throw new Error('WORKFLOW_JOB_PAYLOAD_INVALID');

  const workflow = await db.workflow.findFirst({ where: { id: workflowId, organizationId: job.organizationId } });
  if (!workflow) throw new Error('WORKFLOW_NOT_FOUND');
  if (workflow.status !== 'ACTIVE') throw new Error('WORKFLOW_NOT_ACTIVE');

  const run = await db.workflowRun.findFirst({ where: { id: runId, workflowId } });
  if (!run) throw new Error('WORKFLOW_RUN_NOT_FOUND');

  await db.workflowRun.update({
    where: { id: run.id },
    data: { status: 'RUNNING', startedAt: new Date(), input: toJsonValue(input), error: null },
  });

  try {
    const definition = workflow.definition as { nodes?: Array<{ id?: string; type: 'condition' | 'agent' | 'action' | 'end'; config?: Record<string, unknown> }> };
    const results: Prisma.InputJsonValue[] = [];

    for (const node of definition.nodes ?? []) {
      if (node.type === 'condition' && !conditionMatches(node.config ?? {}, input)) {
        results.push(toJsonValue({ nodeId: node.id, skipped: true, reason: 'condition_failed' }));
        continue;
      }

      if (node.type === 'agent') {
        const agentId = typeof node.config?.agentId === 'string' ? node.config.agentId : '';
        if (!agentId) throw new Error('AGENT_ID_REQUIRED');
        const agent = await db.agent.findFirst({ where: { id: agentId, organizationId: job.organizationId, enabled: true } });
        if (!agent) throw new Error('AGENT_NOT_AVAILABLE');
        const agentRun = await db.agentRun.create({
          data: {
            agentId: agent.id,
            workflowRunId: run.id,
            status: 'SUCCEEDED',
            input: toJsonValue(input),
            output: toJsonValue({ accepted: true, agentType: agent.type }),
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        });
        results.push(toJsonValue({ nodeId: node.id, agentRunId: agentRun.id, status: 'SUCCEEDED' }));
        continue;
      }

      results.push(toJsonValue({ nodeId: node.id, status: node.type === 'action' ? 'accepted' : 'completed' }));
    }

    const output = toJsonValue({ results });
    await db.workflowRun.update({ where: { id: run.id }, data: { status: 'SUCCEEDED', output, finishedAt: new Date() } });
    await db.auditEvent.create({
      data: {
        organizationId: job.organizationId,
        action: 'workflow.executed',
        entityType: 'WorkflowRun',
        entityId: run.id,
        metadata: toJsonValue({ workflowId, jobId: job }),
      },
    });
    return { runId: run.id, status: 'SUCCEEDED', output };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WORKFLOW_EXECUTION_FAILED';
    await db.workflowRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: message, finishedAt: new Date() } });
    await db.auditEvent.create({
      data: {
        organizationId: job.organizationId,
        action: 'workflow.failed',
        entityType: 'WorkflowRun',
        entityId: run.id,
        metadata: toJsonValue({ workflowId, error: message }),
      },
    });
    throw error;
  }
}

async function executeSyntic(job: { organizationId: string; payload: Prisma.JsonValue }) {
  const payload = asRecord(job.payload);
  const input = asRecord(payload.input as Prisma.JsonValue);
  const task = typeof input.task === 'string' ? input.task : 'Execute the requested Dallol workflow.';
  const response = await getOpenAI().responses.create({
    model: process.env.SYNTIC_MODEL ?? 'gpt-5',
    input: [
      { role: 'system', content: 'You are the Dallol production worker. Return JSON with action and arguments. Only choose crm.create_contact when the supplied task clearly requests creating a CRM contact.' },
      { role: 'user', content: JSON.stringify({ task, input }) },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'worker_action',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: { action: { type: 'string', enum: ['crm.create_contact', 'noop'] }, arguments: { type: 'object', additionalProperties: true } },
          required: ['action', 'arguments'],
        },
      },
    },
  });
  const plan = JSON.parse(response.output_text) as { action: string; arguments: Record<string, unknown> };
  if (plan.action === 'crm.create_contact') return executeCrmContact({ organizationId: job.organizationId, payload: { input: plan.arguments as Prisma.JsonObject } });
  return { action: 'noop' };
}

async function executeJob(job: { id: string; type: string; organizationId: string; payload: Prisma.JsonValue }) {
  if (job.type === 'workflow.execute') return executeWorkflow(job);
  if (job.type === 'syntic.workflow.execute') return executeSyntic(job);
  if (job.type === 'crm.create_contact') return executeCrmContact(job);
  if (job.type === 'workflow') return { accepted: true, type: job.type };
  throw new Error(`UNSUPPORTED_JOB_TYPE:${job.type}`);
}

async function claimJob() {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + 60_000);
  return db.$transaction(async (tx) => {
    const candidates = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM "Job"
      WHERE ((status = 'QUEUED' AND "availableAt" <= ${now}) OR (status = 'FAILED' AND "availableAt" <= ${now}) OR (status = 'RUNNING' AND "leaseUntil" < ${now}))
      ORDER BY "createdAt" ASC FOR UPDATE SKIP LOCKED LIMIT 1
    `);
    if (candidates.length === 0) return null;
    return tx.job.update({ where: { id: candidates[0].id }, data: { status: 'RUNNING', leasedBy: workerId, leaseUntil, attempts: { increment: 1 } } });
  });
}

async function tick() {
  const job = await claimJob();
  if (!job) return;
  try {
    console.log(JSON.stringify({ event: 'job.claimed', jobId: job.id, type: job.type, workerId, attempt: job.attempts }));
    const result = await executeJob(job);
    await db.job.update({ where: { id: job.id }, data: { status: 'SUCCEEDED', result, leaseUntil: null, leasedBy: null, completedAt: new Date(), lastError: null } });
    console.log(JSON.stringify({ event: 'job.succeeded', jobId: job.id, type: job.type, workerId }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JOB_FAILED';
    const terminal = job.attempts >= Math.min(job.maxAttempts, 5);
    const delay = Math.min(60_000 * 2 ** Math.max(job.attempts - 1, 0), 3_600_000);
    await db.job.update({ where: { id: job.id }, data: { status: terminal ? 'DEAD_LETTER' : 'FAILED', lastError: message, availableAt: new Date(Date.now() + delay), leaseUntil: null, leasedBy: null } });
    console.error(JSON.stringify({ event: 'job.failed', jobId: job.id, type: job.type, workerId, error: message, terminal }));
  }
}

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ event: 'syntic.worker.stopping', workerId, signal }));
  await db.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

async function main() {
  console.log(JSON.stringify({ event: 'syntic.worker.started', workerId, pollMs }));
  while (!shuttingDown) {
    await tick();
    if (!shuttingDown) await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

main().catch(async (error) => {
  console.error(JSON.stringify({ event: 'syntic.worker.fatal', workerId, error: error instanceof Error ? error.message : String(error) }));
  await db.$disconnect();
  process.exit(1);
});
