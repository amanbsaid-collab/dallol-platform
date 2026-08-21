'use client';

import { FormEvent, useEffect, useState } from 'react';

export default function CrmPage() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const [p, c, d] = await Promise.all([
      fetch('/api/crm/pipelines').then((r) => r.json()),
      fetch('/api/crm/contacts').then((r) => r.json()),
      fetch('/api/crm/deals').then((r) => r.json()),
    ]);
    setPipelines(p.pipelines ?? []);
    setContacts(c.contacts ?? []);
    setDeals(d.deals ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function createContact(event: FormEvent) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/crm/contacts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ firstName: name, email }) });
    if (!response.ok) { const body = await response.json().catch(() => ({})); setError(body.error ?? 'Unable to create contact'); return; }
    setName(''); setEmail(''); await load();
  }

  async function moveDeal(id: string, stageId: string) {
    const response = await fetch(`/api/crm/deals/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ stageId }) });
    if (!response.ok) { const body = await response.json().catch(() => ({})); setError(body.error ?? 'Unable to move deal'); return; }
    await load();
  }

  return <main style={{ maxWidth: 1200, margin: '32px auto', padding: 24 }}>
    <header><p>Dallol CRM</p><h1>Contacts & Pipeline</h1><p>Tenant-scoped lifecycle management with auditable deal transitions.</p></header>
    <form onSubmit={createContact} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '24px 0' }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact first name" required />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
      <button type="submit">Add contact</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Loading CRM…</p> : <>
      <section><h2>Contacts ({contacts.length})</h2><ul>{contacts.map((c) => <li key={c.id}>{c.firstName} {c.lastName ?? ''}{c.company ? ` — ${c.company}` : ''}{c.email ? ` — ${c.email}` : ''}</li>)}</ul></section>
      <section style={{ marginTop: 32 }}><h2>Pipeline</h2>{pipelines.length === 0 ? <p>No pipeline configured yet.</p> : pipelines.map((pipeline) => <div key={pipeline.id} style={{ display: 'grid', gap: 12, marginTop: 16 }}><h3>{pipeline.name}</h3>{pipeline.stages.map((stage: any) => <div key={stage.id} style={{ border: '1px solid #ddd', padding: 12 }}><strong>{stage.name}</strong><div>{deals.filter((d) => d.pipelineId === pipeline.id && d.stageId === stage.id).map((deal) => <article key={deal.id} style={{ marginTop: 8 }}><span>{deal.name} — ${(deal.valueCents / 100).toFixed(2)}</span><select value={deal.stageId} onChange={(e) => void moveDeal(deal.id, e.target.value)}>{pipeline.stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></article>)}</div></div>)}</div>)}
      </section>
    </>}
  </main>;
}
