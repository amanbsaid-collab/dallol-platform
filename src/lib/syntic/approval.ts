import { db } from '@/lib/db';

export type ApprovalDecision = 'APPROVE' | 'REJECT';

function toJsonValue(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value ?? {})) as Record<string, unknown>;
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
      metadata: {
        status: 'PENDING',
        task: input.task,
        proposedMutation: toJsonValue(input.proposedMutation),
      },
    },
  });
}

export function isApprovalRequired(action: string) {
  return ['crm.update_contact', 'crm.create_deal', 'workflow.activate'].includes(action);
}
