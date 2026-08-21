import { executeWorkflow } from '@/lib/workflows/engine';
import { claimNextJob, completeJob, failJob } from '@/lib/jobs/runtime';

export async function processWorkflowJob(input: { organizationId: string; jobId: string; workflowId: string; payload: unknown; attempt?: number }) {
  const attempt = input.attempt ?? 1;
  const job = await claimNextJob(`workflow-${input.organizationId}`);
  if (!job || job.id !== input.jobId) throw new Error('JOB_NOT_CLAIMED');

  try {
    const payload = input.payload && typeof input.payload === 'object'
      ? input.payload as { input?: unknown; runId?: string }
      : { input: input.payload };
    const result = await executeWorkflow(input.workflowId, payload.input, payload.runId);
    await completeJob(input.jobId, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JOB_FAILED';
    await failJob(input.jobId, message);
    void attempt;
    throw error;
  }
}
