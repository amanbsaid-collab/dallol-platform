import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export type ApprovalDecision = 'APPROVE' | 'REJECT';

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

export async function createApprovalRequest(input: {
  organizationId: string;
  userId: string;
  task: string;
  proposedMutation: unknown;
}) {
  return db.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'syntic.approval_requested',
      entityType: 'SynticApproval',
      metadata: toJsonValue({
        status: 'PENDING',
        task: input.task,
        proposedMutation: toJsonValue(input.proposedMutation),
      }),
    },
  });
}

export function isApprovalRequired(action: string) {
  return ['crm.update_contact', 'crm.create_deal', 'workflow.activate'].includes(action);
}
