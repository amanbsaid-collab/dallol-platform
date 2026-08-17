import { db } from '@/lib/db';
import { emitSynticEvent } from '@/lib/syntic/events';

export async function dispatchScheduledWorkflows(now = new Date()) {
  const workflows = await db.workflow.findMany({ where: { status: 'ACTIVE' } });
  const due = workflows.filter((workflow) => {
    const definition = workflow.definition as { schedule?: { nextRunAt?: string } };
    const nextRunAt = definition.schedule?.nextRunAt;
    return !!nextRunAt && new Date(nextRunAt) <= now;
  });
  const results = [];
  for (const workflow of due) {
    results.push(await emitSynticEvent({ organizationId: workflow.organizationId, type: 'schedule.tick', payload: { workflowId: workflow.id, scheduledAt: now.toISOString() } }));
  }
  return { due: due.length, results };
}
