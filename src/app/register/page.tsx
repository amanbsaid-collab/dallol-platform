'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to create account');
      router.push('/dashboard');
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create account'); }
    finally { setBusy(false); }
  }

  return <main style={{ maxWidth: 480, margin: '64px auto', padding: 24 }}>
    <h1>Create your Dallol account</h1>
    <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
      <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      <input required type="password" minLength={12} placeholder="Password (12+ characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      <input required placeholder="Organization name" value={form.organizationName} onChange={e => setForm({ ...form, organizationName: e.target.value })} />
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} type="submit">{busy ? 'Creating…' : 'Create account'}</button>
    </form>
    <p style={{ marginTop: 16 }}>Already registered? <Link href="/login">Sign in</Link></p>
  </main>;
}
