import { NextResponse } from 'next/server';

export function proxy(request) {
  // Public APIs that don't require authentication
  const publicApiPaths = ['/api/auth', '/api/login', '/api/upload'];
  const isPublicApi = publicApiPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // Protect all other /api routes
  if (request.nextUrl.pathname.startsWith('/api/') && !isPublicApi) {
    // Support NextAuth v4/v5 cookies and custom 'token' cookie
    const hasSession = 
      request.cookies.has('token') ||
      request.cookies.has('authjs.session-token') || 
      request.cookies.has('__Secure-authjs.session-token') ||
      request.cookies.has('next-auth.session-token') || 
      request.cookies.has('__Secure-next-auth.session-token');

    if (!hasSession) {
      // Return 401 Unauthorized for API requests
      return NextResponse.json({ error: "Unauthorized access. Authentication required." }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on API routes to avoid blocking public pages
  matcher: ['/api/:path*'],
};
