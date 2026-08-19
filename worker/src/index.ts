import { randomUUID } from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import OpenAI from 'openai';

const db = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const workerId = process.env.WORKER_ID ?? `syntic-${randomUUID()}`;
const pollMs = Number(process.env.WORKER_POLL_MS ?? 1000);

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
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

async function executeSyntic(job: { organizationId: string; payload: Prisma.JsonValue }) {
  const payload = asRecord(job.payload);
  const input = asRecord(payload.input as Prisma.JsonValue);
  const task = typeof input.task === 'string' ? input.task : 'Execute the requested Dallol workflow.';

  const response = await openai.responses.create({
    model: process.env.SYNTIC_MODEL ?? 'gpt-5.6-luna',
    input: [
      { role: 'system', content: 'You are the Dallol production worker. Return JSON with action and arguments. Only choose crm.create_contact when the supplied task clearly requests creating a CRM contact.' },
      { role: 'user', content: JSON.stringify({ task, input }) },
    ],
    text: { format: { type: 'json_schema', name: 'worker_action', strict: true, schema: { type: 'object', additionalProperties: false, properties: { action: { type: 'string', enum: ['crm.create_contact', 'noop'] }, arguments: { type: 'object', additionalProperties: true } }, required: ['action', 'arguments'] } } },
  });
  const plan = JSON.parse(response.output_text) as { action: string; arguments: Record<string, unknown> };
  if (plan.action === 'crm.create_contact') return executeCrmContact({ organizationId: job.organizationId, payload: { input: plan.arguments } });
  return { action: 'noop' };
}

async function executeJob(job: { id: string; type: string; organizationId: string; payload: Prisma.JsonValue }) {
  if (job.type === 'syntic.workflow.execute') return executeSyntic(job);
  if (job.type === 'crm.create_contact') return executeCrmContact(job);
  if (job.type === 'workflow') return { accepted: true, type: job.type };
  throw new Error(`UNSUPPORTED_JOB_TYPE:${job.type}`);
}

async function tick() {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + 60_000);
  const job = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const candidate = await tx.job.findFirst({ where: { OR: [{ status: 'QUEUED', availableAt: { lte: now } }, { status: 'FAILED', availableAt: { lte: now } }, { status: 'RUNNING', leaseUntil: { lt: now } }] }, orderBy: { createdAt: 'asc' } });
    if (!candidate) return null;
    return tx.job.update({ where: { id: candidate.id }, data: { status: 'RUNNING', leasedBy: workerId, leaseUntil, attempts: { increment: 1 } } });
  });
  if (!job) return;

  try {
    console.log(JSON.stringify({ event: 'job.claimed', jobId: job.id, type: job.type, workerId }));
    const result = await executeJob(job);
    await db.job.update({ where: { id: job.id }, data: { status: 'SUCCEEDED', result, leaseUntil: null, leasedBy: null, completedAt: new Date(), lastError: null } });
    console.log(JSON.stringify({ event: 'job.succeeded', jobId: job.id, type: job.type }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JOB_FAILED';
    const terminal = job.attempts >= Math.min(job.maxAttempts, 5);
    const delay = Math.min(60_000 * 2 ** Math.max(job.attempts - 1, 0), 3_600_000);
    await db.job.update({ where: { id: job.id }, data: { status: terminal ? 'DEAD_LETTER' : 'FAILED', lastError: message, availableAt: new Date(Date.now() + delay), leaseUntil: null, leasedBy: null } });
    console.error(JSON.stringify({ event: 'job.failed', jobId: job.id, type: job.type, error: message, terminal }));
  }
}

async function main() {
  console.log(JSON.stringify({ event: 'syntic.worker.started', workerId, pollMs }));
  while (true) { await tick(); await new Promise((resolve) => setTimeout(resolve, pollMs)); }
}

main().catch(async (error) => { console.error(error); await db.$disconnect(); process.exit(1); });
