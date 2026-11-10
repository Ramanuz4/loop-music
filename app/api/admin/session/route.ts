import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSession,
} from '../../../../src/admin-session';

export function GET(request: NextRequest) {
  const email = process.env.ADMIN_EMAIL;
  const authenticated = Boolean(email) && isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const response = NextResponse.json(
    authenticated ? { authenticated, email } : { authenticated },
    { status: authenticated ? 200 : 401 },
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
