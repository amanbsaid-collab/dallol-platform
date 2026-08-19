import { db } from '@/lib/db';
import { enqueueJob } from '@/lib/jobs/runtime';
import { runSynticAgent } from '@/lib/syntic/intelligence';

export type ProductionWorkflowRequest = {
  organizationId: string;
  userId?: string;
  workflowId: string;
  input: Record<string, unknown>;
  idempotencyKey: string;
  autoApprove?: boolean;
};

export async function enqueueProductionWorkflow(request: ProductionWorkflowRequest) {
  const workflow = await db.workflow.findFirst({
    where: { id: request.workflowId, organizationId: request.organizationId, status: 'ACTIVE' },
    select: { id: true, name: true },
  });
  if (!workflow) throw new Error('WORKFLOW_NOT_FOUND_OR_INACTIVE');

  return enqueueJob({
    organizationId: request.organizationId,
    type: 'syntic.workflow.execute',
    payload: {
      workflowId: request.workflowId,
      input: request.input,
      userId: request.userId,
      autoApprove: request.autoApprove === true,
    },
    idempotencyKey: request.idempotencyKey,
  });
}

export async function executeProductionAgent(args: {
  organizationId: string;
  userId?: string;
  task: string;
  context: Record<string, unknown>;
  autoApprove?: boolean;
}) {
  return runSynticAgent(args);
}
