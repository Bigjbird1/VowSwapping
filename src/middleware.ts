import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected routes that require authentication
const protectedRoutes = [
  '/profile',
  '/profile/addresses',
  '/profile/orders',
  '/checkout',
];

// Security headers to add to all responses
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  // Check both token existence and expiration
  const isAuthenticated = token && (typeof token.exp === 'number' ? token.exp * 1000 > Date.now() : !!token);
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing a protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to profile if accessing auth pages while already authenticated
  if (
    isAuthenticated &&
    (request.nextUrl.pathname.startsWith('/auth/signin') ||
      request.nextUrl.pathname.startsWith('/auth/signup'))
  ) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Export a named function for testing purposes
export const authMiddleware = middleware;

export const config = {
  matcher: [
    '/profile/:path*',
    '/checkout/:path*',
    '/auth/signin',
    '/auth/signup',
    '/api/:path*',
  ],
};
