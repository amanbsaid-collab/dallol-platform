import Link from 'next/link';

const features = [
  { title: 'Syntic AI', eyebrow: 'INTELLIGENCE', description: 'Turn business context into intelligent decisions and production workflows.', href: '/dashboard', metric: '24/7' },
  { title: 'CRM & Revenue', eyebrow: 'GROWTH', description: 'Manage relationships, opportunities, pipeline stages and revenue from one command center.', href: '/dashboard/crm', metric: '360°' },
  { title: 'Automation', eyebrow: 'EXECUTION', description: 'Connect approvals, jobs and agents into repeatable workflows that actually execute.', href: '/dashboard', metric: 'AUTO' },
];

const stats = [
  ['01', 'One operating system'],
  ['AI', 'Intelligent execution'],
  ['24/7', 'Always-on workflows'],
  ['∞', 'Built to scale'],
];

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #07111f 0%, #0b1830 48%, #0e2340 100%)', color: '#f8fafc', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 720, background: 'radial-gradient(circle at 75% 18%, rgba(56,189,248,.20), transparent 32%), radial-gradient(circle at 18% 8%, rgba(99,102,241,.18), transparent 30%)', pointerEvents: 'none' }} />

      <nav style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', padding: '26px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#38bdf8,#6366f1)', fontWeight: 900, boxShadow: '0 8px 30px rgba(56,189,248,.25)' }}>D</span>
          <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.03em' }}>Dallol</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 14 }}>
          <Link href="/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Platform</Link>
          <Link href="/dashboard/crm" style={{ color: '#cbd5e1', textDecoration: 'none' }}>CRM</Link>
          <Link href="/login" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/register" style={{ padding: '11px 17px', borderRadius: 9, background: 'white', color: '#0b1830', textDecoration: 'none', fontWeight: 800 }}>Get started</Link>
        </div>
      </nav>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', padding: '94px 28px 70px', display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 60, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 999, background: 'rgba(56,189,248,.10)', border: '1px solid rgba(125,211,252,.18)', color: '#bae6fd', fontSize: 12, fontWeight: 800, letterSpacing: '.12em' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 14px #38bdf8' }} /> SYNTIC AI · BUSINESS OS
          </div>
          <h1 style={{ fontSize: 'clamp(48px, 6.5vw, 82px)', lineHeight: .98, letterSpacing: '-.055em', maxWidth: 820, margin: '24px 0 25px' }}>
            Your business.<br /><span style={{ background: 'linear-gradient(90deg,#7dd3fc,#a5b4fc)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Powered by intelligence.</span>
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 20, lineHeight: 1.65, maxWidth: 690, margin: 0 }}>
            Dallol brings CRM, revenue, automation and an AI workforce together in one intelligent operating system built to move your business forward.
          </p>
          <div style={{ display: 'flex', gap: 13, flexWrap: 'wrap', marginTop: 34 }}>
            <Link href="/register" style={{ padding: '15px 22px', borderRadius: 10, background: 'linear-gradient(135deg,#38bdf8,#6366f1)', color: 'white', textDecoration: 'none', fontWeight: 800, boxShadow: '0 12px 35px rgba(59,130,246,.28)' }}>Launch Dallol →</Link>
            <Link href="/dashboard" style={{ padding: '15px 22px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', color: '#f8fafc', textDecoration: 'none', fontWeight: 700 }}>Explore platform</Link>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -40, background: 'radial-gradient(circle, rgba(56,189,248,.17), transparent 65%)', filter: 'blur(10px)' }} />
          <div style={{ position: 'relative', border: '1px solid rgba(255,255,255,.13)', background: 'linear-gradient(145deg,rgba(15,30,53,.94),rgba(8,18,34,.96))', borderRadius: 20, padding: 18, boxShadow: '0 35px 100px rgba(0,0,0,.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 8px 18px', color: '#94a3b8', fontSize: 12 }}><span>Dallol Command Center</span><span style={{ color: '#7dd3fc' }}>● Live</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {['Revenue', 'Customers', 'AI Agents', 'Workflows'].map((label, i) => <div key={label} style={{ padding: 16, borderRadius: 13, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.07)' }}><div style={{ color: '#94a3b8', fontSize: 11 }}>{label}</div><strong style={{ display: 'block', fontSize: 24, marginTop: 7 }}>{['$42.6K','1,284','18','37'][i]}</strong><span style={{ color: '#67e8f9', fontSize: 11 }}>{['+28.4%','+12.8%','Active','Executing'][i]}</span></div>)}
            </div>
            <div style={{ marginTop: 10, padding: 16, borderRadius: 13, background: 'rgba(56,189,248,.06)', border: '1px solid rgba(125,211,252,.10)' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>SYNTIC ACTIVITY</div>
              {['Qualified 14 high-value leads', 'Started follow-up workflow', 'Generated 8 appointment opportunities'].map((item, i) => <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 0', borderTop: i ? '1px solid rgba(255,255,255,.06)' : 'none', fontSize: 12, color: '#dbeafe' }}><span style={{ color: '#38bdf8' }}>✓</span>{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', padding: '18px 28px 65px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid rgba(255,255,255,.09)', borderBottom: '1px solid rgba(255,255,255,.09)' }}>
          {stats.map(([value, label]) => <div key={label} style={{ padding: '24px 12px' }}><strong style={{ display: 'block', fontSize: 25 }}>{value}</strong><span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span></div>)}
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, background: '#f8fafc', color: '#0f172a', padding: '92px 28px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <p style={{ color: '#2563eb', fontSize: 12, fontWeight: 900, letterSpacing: '.14em' }}>ONE PLATFORM · EVERY OPERATION</p>
          <h2 style={{ fontSize: 'clamp(36px,5vw,58px)', letterSpacing: '-.045em', maxWidth: 700, margin: '12px 0 45px' }}>Everything your business needs to execute.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {features.map(({ title, eyebrow, description, href, metric }) => <article key={title} style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: 18, padding: 27, minHeight: 235, boxShadow: '0 12px 35px rgba(15,23,42,.05)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}><span style={{ color: '#64748b', fontSize: 11, fontWeight: 900, letterSpacing: '.12em' }}>{eyebrow}</span><span style={{ fontWeight: 900, color: '#2563eb' }}>{metric}</span></div><h3 style={{ fontSize: 25, margin: '35px 0 10px' }}>{title}</h3><p style={{ color: '#64748b', lineHeight: 1.65, minHeight: 76 }}>{description}</p><Link href={href} style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 800, fontSize: 14 }}>Explore →</Link></article>)}
          </div>
        </div>
      </section>

      <footer style={{ background: '#07111f', borderTop: '1px solid rgba(255,255,255,.08)', padding: '28px', color: '#64748b', fontSize: 13 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}><span>© 2026 Dallol Ecosystem</span><Link href="/api/health" style={{ color: '#94a3b8' }}>System status</Link></div>
      </footer>
    </main>
  );
}
