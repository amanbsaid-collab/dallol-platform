import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Dallol Platform</h1>
      <p>Production platform foundation.</p>
      <nav style={{ display: 'flex', gap: 16 }}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/login">Sign in</Link>
        <Link href="/register">Create account</Link>
        <Link href="/api/health">System health</Link>
      </nav>
    </main>
  );
}
