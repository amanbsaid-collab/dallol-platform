import { executeWorkflow } from '@/lib/workflows/engine';
import { claimJob, completeJob, failJob } from '@/lib/jobs/runtime';

export async function processWorkflowJob(input: { organizationId: string; jobId: string; workflowId: string; payload: unknown; attempt?: number }) {
  const attempt = input.attempt ?? 1;
  await claimJob({ organizationId: input.organizationId, jobId: input.jobId });
  try {
    const result = await executeWorkflow(input.workflowId, input.payload);
    await completeJob({ organizationId: input.organizationId, jobId: input.jobId, output: result });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JOB_FAILED';
    await failJob({ organizationId: input.organizationId, jobId: input.jobId, error: message, attempts: attempt });
    throw error;
  }
}
