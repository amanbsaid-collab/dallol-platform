'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const industryFamilies: Record<string, string[]> = {
  'Professional Services': ['Accounting Firms','Bookkeeping Services','Tax Practices','Law Firms','Management Consulting','Business Consulting','Staffing & Recruiting','Marketing Agencies','Public Relations Agencies','Design Agencies','Architecture Firms','Engineering Consultancies'],
  'Home & Local Services': ['Residential Cleaning','Commercial Cleaning','Landscaping','HVAC Services','Plumbing','Electrical Contractors','Roofing Contractors','Pest Control','Home Remodeling','Handyman Services','Auto Repair','Property Maintenance'],
  'Health & Wellness': ['Primary Care Clinics','Dental Practices','Optometry Practices','Chiropractic Practices','Physical Therapy','Occupational Therapy','Mental Wellness Practices','Fitness Studios','Personal Training','Nutrition Practices','Med Spas'],
  'Real Estate & Property': ['Residential Brokerage','Commercial Brokerage','Property Management','Vacation Rentals','Real Estate Development','Mortgage Brokerage','Title & Escrow','Home Inspection','Appraisal Services','Facilities Management'],
  'Retail & Commerce': ['General Retail','Fashion Retail','Beauty Retail','Furniture Retail','Electronics Retail','Specialty Food Retail','Ecommerce Brands','Wholesale Distribution','B2B Distribution','Automotive Dealerships'],
  'Hospitality & Travel': ['Hotels','Boutique Hotels','Restaurants','Catering','Event Venues','Event Planning','Travel Agencies','Tour Operators','Hospitality Services'],
  'Technology & Digital': ['SaaS Companies','IT Services','Managed Service Providers','Cybersecurity Services','Cloud Services','Web Development','App Development','Data Services','AI Services','Digital Product Companies'],
  'Finance & Insurance': ['Insurance Agencies','Insurance Brokerage','Financial Advisory','Wealth Management','Lending Services','Mortgage Lending','Bookkeeping & Payroll','Fintech Services','Payment Services','Credit Services'],
  'Construction & Industrial': ['General Contractors','Commercial Construction','Residential Construction','Manufacturing','Industrial Services','Mechanical Contractors','Civil Engineering','Logistics & Freight','Warehousing','Equipment Rental','Field Services'],
  'Education & Training': ['K-12 Schools','Higher Education Services','Tutoring','Test Preparation','Corporate Training','Professional Training','Coaching Businesses','Online Courses','Language Schools','Vocational Training'],
  'Media & Creative': ['Film Production','Video Production','Photography','Music Production','Podcasting','Publishing','Advertising Production','Content Studios','Creator Businesses','Entertainment Services'],
  'Community & Organizations': ['Nonprofits','Associations','Membership Organizations','Community Centers','Faith-Based Organizations','Foundations','Professional Networks','Youth Organizations','Senior Services','Social Enterprises'],
};

const industries = Object.entries(industryFamilies).flatMap(([family, types]) => types.map((name) => ({ name, family })));

export default function IndustriesPage() {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState('All');
  const filtered = useMemo(() => industries.filter((item) => {
    const matchesFamily = family === 'All' || item.family === family;
    const matchesQuery = !query.trim() || `${item.name} ${item.family}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesFamily && matchesQuery;
  }), [family, query]);

  return (
    <main style={{ minHeight: '100vh', background: '#07111f', color: '#f8fafc', padding: '0 24px 80px' }}>
      <nav style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 900, fontSize: 22 }}>Dallol</Link>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}><Link href="/dashboard" style={{ color: '#cbd5e1' }}>Platform</Link><Link href="/dashboard/crm" style={{ color: '#cbd5e1' }}>CRM</Link><Link href="/register" style={{ color: '#7dd3fc', fontWeight: 800 }}>Get started</Link></div>
      </nav>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 0 44px' }}>
        <div style={{ color: '#7dd3fc', fontSize: 12, fontWeight: 900, letterSpacing: '.16em' }}>DALLOL INDUSTRY ENGINE</div>
        <h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: 1, letterSpacing: '-.055em', margin: '18px 0 24px', maxWidth: 900 }}>One operating system.<br /><span style={{ color: '#a5b4fc' }}>125 industry blueprints.</span></h1>
        <p style={{ color: '#cbd5e1', fontSize: 20, lineHeight: 1.7, maxWidth: 800 }}>A searchable catalog of 125 industry types organized into reusable sector families. These are solution blueprints in the application catalog—not claims that every sector is already activated in production.</p>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(220px,300px)', gap: 12, marginBottom: 22 }}>
          <input aria-label="Search industries" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 125 industry types…" style={{ width: '100%', boxSizing: 'border-box', padding: '15px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: 'white', outline: 'none' }} />
          <select aria-label="Filter by sector family" value={family} onChange={(e) => setFamily(e.target.value)} style={{ width: '100%', padding: '15px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: '#101d31', color: 'white', outline: 'none' }}>
            <option>All</option>
            {Object.keys(industryFamilies).map((name) => <option key={name}>{name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>{filtered.length} of {industries.length} blueprint types shown</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>Catalog scope: {Object.keys(industryFamilies).length} sector families</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 14 }}>
          {filtered.map((item, index) => {
            const number = industries.findIndex((entry) => entry.name === item.name) + 1;
            return <article key={item.name} style={{ border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.045)', borderRadius: 16, padding: 20, minHeight: 142 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#64748b', fontSize: 10, fontWeight: 900 }}><span>{String(number).padStart(3, '0')}</span><span>{item.family}</span></div>
              <h2 style={{ fontSize: 18, margin: '20px 0 8px' }}>{item.name}</h2>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.55, margin: 0 }}>Reusable CRM, workflow, automation, knowledge, and approval blueprint.</p>
            </article>;
          })}
        </div>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', border: '1px dashed rgba(255,255,255,.15)', borderRadius: 16, color: '#94a3b8' }}>No industry blueprint matches that search.</div>}
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
