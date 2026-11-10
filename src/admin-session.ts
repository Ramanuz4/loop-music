import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'loop-admin-session';
export const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 8;

export function createAdminSessionToken(now = Date.now()): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const expiresAt = Math.floor(now / 1000) + ADMIN_SESSION_DURATION_SECONDS;
  const signature = createHmac('sha256', secret).update(String(expiresAt)).digest('hex');
  return `${expiresAt}.${signature}`;
}

export function isValidAdminSession(token: string | undefined, now = Date.now()): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return false;

  const [expiresAtText, signature, extra] = token.split('.');
  if (extra !== undefined || !/^\d+$/.test(expiresAtText) || !/^[a-f\d]{64}$/i.test(signature)) return false;

  const expiresAt = Number(expiresAtText);
  const nowInSeconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowInSeconds || expiresAt > nowInSeconds + ADMIN_SESSION_DURATION_SECONDS) return false;

  const expected = createHmac('sha256', secret).update(expiresAtText).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function secureStringEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}
