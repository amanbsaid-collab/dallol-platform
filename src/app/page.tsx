import Link from 'next/link';

const features = [
  ['CRM & Pipeline', 'Manage contacts, deals, lifecycle stages, and revenue opportunities.', '/dashboard/crm'],
  ['Syntic AI', 'Orchestrate production workflows and route work to the right execution agent.', '/dashboard'],
  ['Operations', 'Run tenant-scoped jobs, approvals, persistence, and audit trails from one platform.', '/dashboard'],
];

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: '#f7f8fa', color: '#111827' }}>
      <nav style={{ maxWidth: 1180, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 24 }}>Dallol Ecosystem</strong>
        <div style={{ display: 'flex', gap: 18 }}>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create account</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '80px 24px 56px' }}>
        <p style={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Business infrastructure + AI workforce</p>
        <h1 style={{ fontSize: 'clamp(44px, 7vw, 76px)', lineHeight: 1.02, maxWidth: 900, margin: '16px 0' }}>
          One operating system for growing businesses.
        </h1>
        <p style={{ fontSize: 21, lineHeight: 1.6, maxWidth: 760 }}>
          Dallol unifies CRM, revenue pipelines, workflow automation, and Syntic AI execution in one production platform.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 32 }}>
          <Link href="/register" style={{ padding: '14px 22px', borderRadius: 8, background: '#111827', color: 'white', textDecoration: 'none', fontWeight: 700 }}>Get started</Link>
          <Link href="/login" style={{ padding: '14px 22px', borderRadius: 8, border: '1px solid #d1d5db', textDecoration: 'none', fontWeight: 700 }}>Sign in</Link>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 24px 90px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
        {features.map(([title, description, href]) => (
          <article key={title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24 }}>
            <h2>{title}</h2>
            <p style={{ lineHeight: 1.6, minHeight: 76 }}>{description}</p>
            <Link href={href}>Explore →</Link>
          </article>
        ))}
      </section>

      <footer style={{ maxWidth: 1180, margin: '0 auto', padding: '24px', borderTop: '1px solid #e5e7eb', fontSize: 14 }}>
        <Link href="/api/health">System health</Link>
      </footer>
    </main>
  );
}
