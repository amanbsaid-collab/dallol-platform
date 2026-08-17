import { db } from '@/lib/db';

export async function getAgentExecutionHistory(organizationId: string, agentId: string, limit = 10) {
  return db.agentRun.findMany({
    where: { agentId, agent: { organizationId } },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 50),
    select: { id: true, status: true, input: true, output: true, error: true, createdAt: true },
  });
}

export async function recordAgentMemory(organizationId: string, agentId: string, memory: unknown) {
  const agent = await db.agent.findFirst({ where: { id: agentId, organizationId } });
  if (!agent) throw new Error('AGENT_NOT_AVAILABLE');
  return db.auditEvent.create({
    data: {
      organizationId,
      action: 'syntic.memory_recorded',
      entityType: 'Agent',
      entityId: agentId,
      metadata: { memory },
    },
  });
}
