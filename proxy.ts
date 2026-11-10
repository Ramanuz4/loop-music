import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from './src/admin-session';

export function proxy(request: NextRequest) {
  const isAdminLogin = request.nextUrl.pathname === '/admin/login';
  const hasValidSession = isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (isAdminLogin && hasValidSession) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (!isAdminLogin && !hasValidSession) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
