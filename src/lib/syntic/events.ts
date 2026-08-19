import { db } from '@/lib/db';
import { executeWorkflow } from '@/lib/workflows/engine';

export async function emitSynticEvent(input: { organizationId: string; type: string; payload: unknown }) {
  const workflows = await db.workflow.findMany({ where: { organizationId: input.organizationId, status: 'ACTIVE' } });
  const matches = workflows.filter((workflow: (typeof workflows)[number]) => {
    const definition = workflow.definition as { trigger?: { type?: string } };
    return definition.trigger?.type === input.type;
  });
  const runs: unknown[] = [];
  for (const workflow of matches) runs.push(await executeWorkflow(workflow.id, { event: input.type, payload: input.payload }));
  return { matched: matches.length, runs };
}
