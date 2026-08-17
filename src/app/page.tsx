import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Dallol Platform</h1>
      <p>Production foundation initialized.</p>
      <p><Link href="/api/health">System health</Link></p>
    </main>
  );
}
