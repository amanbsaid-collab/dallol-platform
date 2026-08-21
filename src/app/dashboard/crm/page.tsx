'use client';

import { FormEvent, useEffect, useState } from 'react';

type PipelineStage = { id: string; name: string; position: number };
type Pipeline = { id: string; name: string; stages: PipelineStage[] };
type Contact = { id: string; firstName: string; lastName?: string | null; company?: string | null; email?: string | null };
type Deal = { id: string; name: string; valueCents: number; pipelineId: string; stageId: string };

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${response.status})`);
  return body as T;
}

export default function CrmPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [p, c, d] = await Promise.all([
        readJson<{ pipelines?: Pipeline[] }>(await fetch('/api/crm/pipelines', { cache: 'no-store' })),
        readJson<{ contacts?: Contact[] }>(await fetch('/api/crm/contacts', { cache: 'no-store' })),
        readJson<{ deals?: Deal[] }>(await fetch('/api/crm/deals', { cache: 'no-store' })),
      ]);
      setPipelines(p.pipelines ?? []);
      setContacts(c.contacts ?? []);
      setDeals(d.deals ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load CRM data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createContact(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await readJson(await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ firstName: name, email }),
      }));
      setName('');
      setEmail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create contact');
    }
  }

  async function moveDeal(id: string, stageId: string) {
    setError('');
    try {
      await readJson(await fetch(`/api/crm/deals/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stageId }),
      }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to move deal');
    }
  }

  return <main style={{ maxWidth: 1200, margin: '32px auto', padding: 24 }}>
    <header><p>Dallol CRM</p><h1>Contacts &amp; Pipeline</h1><p>Tenant-scoped lifecycle management with auditable deal transitions.</p></header>
    <form onSubmit={createContact} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '24px 0' }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact first name" required />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
      <button type="submit">Add contact</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Loading CRM…</p> : <>
      <section><h2>Contacts ({contacts.length})</h2><ul>{contacts.map((c) => <li key={c.id}>{c.firstName} {c.lastName ?? ''}{c.company ? ` — ${c.company}` : ''}{c.email ? ` — ${c.email}` : ''}</li>)}</ul></section>
      <section style={{ marginTop: 32 }}><h2>Pipeline</h2>{pipelines.length === 0 ? <p>No pipeline configured yet.</p> : pipelines.map((pipeline) => <div key={pipeline.id} style={{ display: 'grid', gap: 12, marginTop: 16 }}><h3>{pipeline.name}</h3>{pipeline.stages.map((stage) => <div key={stage.id} style={{ border: '1px solid #ddd', padding: 12 }}><strong>{stage.name}</strong><div>{deals.filter((d) => d.pipelineId === pipeline.id && d.stageId === stage.id).map((deal) => <article key={deal.id} style={{ marginTop: 8 }}><span>{deal.name} — ${(deal.valueCents / 100).toFixed(2)}</span><select value={deal.stageId} onChange={(e) => void moveDeal(deal.id, e.target.value)}>{pipeline.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></article>)}</div></div>)}</div>)}
      </section>
    </>}
  </main>;
}
