'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to sign in');
      router.push('/dashboard');
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in'); }
    finally { setBusy(false); }
  }

  return <main style={{ maxWidth: 480, margin: '64px auto', padding: 24 }}>
    <h1>Sign in to Dallol</h1>
    <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
      <input aria-label="Email" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input aria-label="Password" type="password" required minLength={12} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p style={{ marginTop: 16 }}>New to Dallol? <Link href="/register">Create an account</Link></p>
  </main>;
}
