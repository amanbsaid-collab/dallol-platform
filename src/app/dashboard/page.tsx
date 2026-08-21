import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentMembership } from '@/lib/tenant';

export default async function DashboardPage() {
  try {
    const membership = await getCurrentMembership();
    if (!membership) redirect('/login');

    return <main style={{ maxWidth: 1100, margin: '48px auto', padding: 24 }}>
      <header>
        <p>Dallol Platform</p>
        <h1>{membership.organization.name}</h1>
        <p>Signed in as {membership.userId} · {membership.role}</p>
      </header>
      <section style={{ display: 'grid', gap: 16, marginTop: 32 }}>
        <article><h2>CRM</h2><p>Manage contacts and pipelines.</p><Link href="/api/crm/contacts">Contacts API</Link></article>
        <article><h2>Syntic</h2><p>AI workflow orchestration is connected to the production foundation.</p><Link href="/api/health">System health</Link></article>
        <article><h2>Production</h2><p>Tenant-scoped authentication, persistence, audit events and background jobs are enabled.</p></article>
      </section>
    </main>;
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') redirect('/login');
    throw error;
  }
}
