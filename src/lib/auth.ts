import { cookies } from 'next/headers';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db } from './db';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'dallol_session';
const SESSION_DAYS = 30;

export type AuthUser = { id: string; email: string; name?: string | null };
export type AuthSession = { user: AuthUser; expiresAt: Date };

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export async function hashPassword(password: string) {
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [, salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, 'hex');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString('base64url');
  const sessionToken = createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { sessionToken, userId, expires } });
  (await cookies()).set(SESSION_COOKIE, rawToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires });
}

export async function getSession(): Promise<AuthSession | null> {
  const rawToken = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;
  const sessionToken = createHash('sha256').update(rawToken).digest('hex');
  const session = await db.session.findUnique({ where: { sessionToken }, include: { user: true } });
  if (!session || session.expires <= new Date()) return null;
  return { user: { id: session.user.id, email: session.user.email, name: session.user.name }, expiresAt: session.expires };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  return session;
}

export async function destroySession() {
  const store = await cookies();
  const rawToken = store.get(SESSION_COOKIE)?.value;
  if (rawToken) await db.session.deleteMany({ where: { sessionToken: createHash('sha256').update(rawToken).digest('hex') } });
  store.delete(SESSION_COOKIE);
}

export { normalizeEmail };
