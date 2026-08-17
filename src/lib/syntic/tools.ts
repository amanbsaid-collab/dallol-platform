import { db } from '@/lib/db';

type ToolCall = { name: string; arguments: Record<string, unknown> };

export async function executeApprovedTool(args: {
  organizationId: string;
  toolCall: ToolCall;
}) {
  const { name, arguments: input } = args.toolCall;

  switch (name) {
    case 'crm.update_contact': {
      const contactId = typeof input.contactId === 'string' ? input.contactId : '';
      if (!contactId) throw new Error('CONTACT_ID_REQUIRED');
      const contact = await db.contact.findFirst({ where: { id: contactId, organizationId: args.organizationId } });
      if (!contact) throw new Error('CONTACT_NOT_FOUND');

      const data: Record<string, unknown> = {};
      for (const field of ['firstName', 'lastName', 'email', 'phone', 'company', 'status']) {
        if (input[field] !== undefined) data[field] = input[field];
      }
      return db.contact.update({ where: { id: contactId }, data });
    }
    default:
      throw new Error(`TOOL_NOT_ALLOWED:${name}`);
  }
}
