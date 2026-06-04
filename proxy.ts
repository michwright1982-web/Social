import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add the routes you want to protect here
const protectedRoutes = ['/dashboard', '/studio', '/editor', '/vault', '/analytics', '/brand', '/setup-guide'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Exclude auth routes, static files, and API routes from protection
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicFile = pathname.startsWith('/_next') || pathname.includes('.'); // e.g., favicon.ico

  if (isPublicFile || isApiRoute) {
    return NextResponse.next();
  }

  const session = request.cookies.get('ai_marketing_session');

  // If user is trying to access a protected route without a session
  if (isProtectedRoute && !session && !isAuthRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already logged in and tries to access login/signup
  if (session && isAuthRoute) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
