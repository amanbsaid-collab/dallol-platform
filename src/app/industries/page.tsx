import Link from 'next/link';

const categories = [
  ['Professional Services', 'Consulting, accounting, legal, staffing, agencies, and advisory firms'],
  ['Home & Local Services', 'Cleaning, landscaping, repairs, trades, maintenance, and property services'],
  ['Health & Wellness', 'Clinics, wellness practices, fitness, therapy, and personal care operations'],
  ['Real Estate & Property', 'Brokerages, property managers, developers, leasing, and facilities'],
  ['Retail & Commerce', 'Retailers, ecommerce, specialty stores, wholesalers, and distributors'],
  ['Hospitality & Travel', 'Hotels, restaurants, catering, events, tourism, and travel operators'],
  ['Technology & Digital', 'Software, IT, cybersecurity, digital products, and technical services'],
  ['Finance & Insurance', 'Financial services, insurance, lending, bookkeeping, and fintech workflows'],
  ['Construction & Industrial', 'Construction, manufacturing, engineering, logistics, and field operations'],
  ['Education & Training', 'Schools, tutors, coaches, training companies, and learning providers'],
  ['Media & Creative', 'Marketing, media, production, design, entertainment, and creators'],
  ['Community & Organizations', 'Nonprofits, associations, membership organizations, and community services'],
];

export default function IndustriesPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07111f', color: '#f8fafc', padding: '0 24px 80px' }}>
      <nav style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 900, fontSize: 22 }}>Dallol</Link>
        <div style={{ display: 'flex', gap: 18 }}><Link href="/dashboard" style={{ color: '#cbd5e1' }}>Platform</Link><Link href="/register" style={{ color: '#7dd3fc', fontWeight: 800 }}>Get started</Link></div>
      </nav>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 0 54px' }}>
        <div style={{ color: '#7dd3fc', fontSize: 12, fontWeight: 900, letterSpacing: '.16em' }}>DALL0L INDUSTRY ENGINE</div>
        <h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: 1, letterSpacing: '-.055em', margin: '18px 0 24px', maxWidth: 900 }}>One operating system.<br /><span style={{ color: '#a5b4fc' }}>125 industry solutions.</span></h1>
        <p style={{ color: '#cbd5e1', fontSize: 20, lineHeight: 1.7, maxWidth: 800 }}>Dallol is being structured around reusable sector playbooks so the same intelligence, CRM, workflow, automation, and knowledge infrastructure can be adapted across 125 industry types.</p>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 16 }}>
        {categories.map(([title, description], index) => (
          <article key={title} style={{ border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.045)', borderRadius: 18, padding: 24, minHeight: 190 }}>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 900 }}>SECTOR FAMILY {String(index + 1).padStart(2, '0')}</div>
            <h2 style={{ fontSize: 21, margin: '18px 0 10px' }}>{title}</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{description}</p>
          </article>
        ))}
      </section>

      <section style={{ maxWidth: 1100, margin: '70px auto 0', padding: 30, borderRadius: 20, border: '1px solid rgba(125,211,252,.15)', background: 'linear-gradient(135deg,rgba(56,189,248,.08),rgba(99,102,241,.08))' }}>
        <div style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 900, letterSpacing: '.12em' }}>REPLICATION MODEL</div>
        <h2 style={{ fontSize: 32, letterSpacing: '-.03em', margin: '12px 0' }}>Build once. Adapt by sector. Learn continuously.</h2>
        <p style={{ color: '#cbd5e1', lineHeight: 1.7, maxWidth: 800 }}>Each activated sector can inherit the Dallol core, then receive its own workflows, offers, agent roles, approval boundaries, knowledge records, and operating metrics. Production claims remain tied to actual application data.</p>
        <Link href="/register" style={{ display: 'inline-block', marginTop: 18, padding: '13px 18px', borderRadius: 9, background: 'white', color: '#07111f', textDecoration: 'none', fontWeight: 900 }}>Start with Dallol →</Link>
      </section>
    </main>
  );
}
