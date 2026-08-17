import { db } from '@/lib/db';

export type ApprovalDecision = 'APPROVE' | 'REJECT';

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
        proposedMutation: input.proposedMutation,
      },
    },
  });
}

export function isApprovalRequired(action: string) {
  return ['crm.update_contact', 'crm.create_deal', 'workflow.activate'].includes(action);
}
