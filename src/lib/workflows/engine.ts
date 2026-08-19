import { db } from '@/lib/db';
import { writeAuditEvent } from '@/lib/audit';

type WorkflowNode = {
  id?: string;
  type: 'condition' | 'agent' | 'action' | 'end';
  config?: Record<string, unknown>;
};

type WorkflowDefinition = {
  nodes?: WorkflowNode[];
};

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

export async function executeWorkflow(workflowId: string, input: unknown) {
  const workflow = await db.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new Error('WORKFLOW_NOT_FOUND');
  if (workflow.status !== 'ACTIVE') throw new Error('WORKFLOW_NOT_ACTIVE');

  const run = await db.workflowRun.create({
    data: { workflowId, status: 'RUNNING', input: input as object },
  });

  try {
    const definition = workflow.definition as WorkflowDefinition;
    const nodes = definition.nodes ?? [];
    const results: unknown[] = [];

    for (const node of nodes) {
      if (node.type === 'condition' && !conditionMatches(node.config ?? {}, input)) {
        results.push({ nodeId: node.id, skipped: true, reason: 'condition_failed' });
        continue;
      }

      if (node.type === 'agent') {
        const agentId = typeof node.config?.agentId === 'string' ? node.config.agentId : undefined;
        if (!agentId) throw new Error('AGENT_ID_REQUIRED');
        const agent = await db.agent.findFirst({ where: { id: agentId, organizationId: workflow.organizationId, enabled: true } });
        if (!agent) throw new Error('AGENT_NOT_AVAILABLE');
        const agentRun = await db.agentRun.create({
          data: { agentId: agent.id, workflowRunId: run.id, status: 'SUCCEEDED', input: input as object, output: { accepted: true, agentType: agent.type } },
        });
        results.push({ nodeId: node.id, agentRunId: agentRun.id, status: 'SUCCEEDED' });
        continue;
      }

      results.push({ nodeId: node.id, status: node.type === 'action' ? 'accepted' : 'completed' });
    }

    const output = { results };
    await db.workflowRun.update({ where: { id: run.id }, data: { status: 'SUCCEEDED', output, finishedAt: new Date() } });
    await writeAuditEvent({ organizationId: workflow.organizationId, action: 'workflow.executed', entityType: 'WorkflowRun', entityId: run.id, metadata: { workflowId } });
    return { runId: run.id, status: 'SUCCEEDED', output };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WORKFLOW_EXECUTION_FAILED';
    await db.workflowRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: message, finishedAt: new Date() } });
    await writeAuditEvent({ organizationId: workflow.organizationId, action: 'workflow.failed', entityType: 'WorkflowRun', entityId: run.id, metadata: { workflowId, error: message } });
    throw error;
  }
}
