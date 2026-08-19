import OpenAI from 'openai';
import { db } from '@/lib/db';
import { writeAuditEvent } from '@/lib/audit';

let client: OpenAI | undefined;

function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    client = new OpenAI({ apiKey });
  }
  return client;
}

const DEFAULT_MODEL = process.env.SYNTIC_MODEL ?? 'gpt-5.6-luna';

type AgentSelection = { agentId: string; reason: string; confidence: number };
type ToolCall = { name: string; arguments: Record<string, unknown> };
type Mutation = { type: string; status?: 'applied' | 'pending' };
type SynticResult = { status: 'completed' | 'approval_required' | 'failed'; agentId?: string; response?: unknown; toolCalls: ToolCall[]; mutations: Array<{ type: string; status: 'applied' | 'pending' }>; approvalRequired: boolean };

type ExecutionPlan = { response: unknown; toolCalls: ToolCall[]; mutations: Mutation[] };
const SYSTEM_PROMPT = `You are Syntic, the execution intelligence layer for Dallol.\nSelect the best available agent for the task, reason only from supplied context, and return structured execution intent.\nNever invent CRM records, permissions, tool results, or completed mutations.\nActions that mutate CRM/workflow state require explicit approval unless the workflow marks them as auto-approved.`;

export async function selectAgent(organizationId: string, task: string): Promise<AgentSelection> {
  const agents = await db.agent.findMany({ where: { organizationId, enabled: true }, select: { id: true, name: true, type: true, instructions: true } });
  if (!agents.length) throw new Error('NO_ACTIVE_AGENTS');
  const response = await getOpenAI().responses.create({
    model: DEFAULT_MODEL,
    input: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: JSON.stringify({ task, availableAgents: agents }) }],
    text: { format: { type: 'json_schema', name: 'agent_selection', strict: true, schema: { type: 'object', additionalProperties: false, properties: { agentId: { type: 'string' }, reason: { type: 'string' }, confidence: { type: 'number' } }, required: ['agentId', 'reason', 'confidence'] } } },
  });
  const parsed = JSON.parse(response.output_text) as AgentSelection;
  if (!agents.some((agent: (typeof agents)[number]) => agent.id === parsed.agentId)) throw new Error('INVALID_AGENT_SELECTION');
  return parsed;
}

export async function runSynticAgent(args: { organizationId: string; userId?: string; task: string; context: Record<string, unknown>; autoApprove?: boolean }): Promise<SynticResult> {
  const selection = await selectAgent(args.organizationId, args.task);
  const agent = await db.agent.findFirst({ where: { id: selection.agentId, organizationId: args.organizationId, enabled: true } });
  if (!agent) throw new Error('AGENT_NOT_AVAILABLE');
  const response = await getOpenAI().responses.create({
    model: DEFAULT_MODEL,
    input: [{ role: 'system', content: `${SYSTEM_PROMPT}\nAgent: ${agent.name}\nInstructions: ${agent.instructions ?? 'Follow the task and context precisely.'}` }, { role: 'user', content: JSON.stringify({ task: args.task, context: args.context }) }],
    text: { format: { type: 'json_schema', name: 'syntic_execution', strict: true, schema: { type: 'object', additionalProperties: false, properties: { response: {}, toolCalls: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, arguments: { type: 'object', additionalProperties: true } }, required: ['name', 'arguments'] } }, mutations: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { type: { type: 'string' } }, required: ['type'] } } }, required: ['response', 'toolCalls', 'mutations'] } } },
  });
  const plan = JSON.parse(response.output_text) as ExecutionPlan;
  const approvalRequired = plan.mutations.length > 0 && !args.autoApprove;
  const result: SynticResult = { status: approvalRequired ? 'approval_required' : 'completed', agentId: agent.id, response: plan.response, toolCalls: plan.toolCalls, mutations: plan.mutations.map((mutation: Mutation) => ({ type: mutation.type, status: approvalRequired ? 'pending' : 'applied' })), approvalRequired };
  await writeAuditEvent({ organizationId: args.organizationId, userId: args.userId, action: approvalRequired ? 'syntic.approval_required' : 'syntic.execution_completed', entityType: 'Agent', entityId: agent.id, metadata: { task: args.task, selection, result } });
  return result;
}
