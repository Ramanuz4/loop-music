import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_DURATION_SECONDS,
  createAdminSessionToken,
  secureStringEqual,
} from '../../../../src/admin-session';

export async function POST(request: NextRequest) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const token = createAdminSessionToken();

  if (!expectedEmail || !expectedPassword || !token) {
    return NextResponse.json({ error: 'Admin sign-in is not configured on this server.' }, { status: 503 });
  }

  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  if (typeof credentials !== 'object' || credentials === null || !('email' in credentials) || !('password' in credentials) || typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const emailMatches = secureStringEqual(credentials.email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
  const passwordMatches = secureStringEqual(credentials.password, expectedPassword);
  if (!emailMatches || !passwordMatches) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true, email: expectedEmail });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
