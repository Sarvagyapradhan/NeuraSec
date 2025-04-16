import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected paths that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/profile",
  "/settings",
  "/threat-analyzer",
  "/url-scanner",
  "/file-scanner",
];

// Admin-only paths
const ADMIN_PATHS = [
  "/admin",
];

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/auth/google/success",
];

// Enable debug logs
const DEBUG = process.env.NODE_ENV !== 'production';

// Debug log function
function log(...args: any[]) {
  if (DEBUG) {
    console.log('[Middleware]', ...args);
  }
}

// Simple token validation to check if token is expired or malformed
function isTokenValid(token: string): boolean {
  try {
    // Basic check for JWT format (header.payload.signature)
    if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
      log('Invalid token format');
      return false;
    }

    // Decode payload (without verification - just to check expiration)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      log('Token expired');
      return false;
    }
    
    return true;
  } catch (error) {
    log('Token validation error:', error);
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  log(`Processing request for path: ${pathname}`);
  
  // Skip API routes
  if (pathname.startsWith('/api')) {
    log('Skipping API route');
    return NextResponse.next();
  }

  // Skip public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    log('Skipping public path');
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get("auth_token")?.value;
  log('Auth token present:', !!token);
  
  // Handle root path
  if (pathname === '/' || pathname === '') {
    log('Root path - redirecting to dashboard if authenticated, otherwise to login');
    if (token && isTokenValid(token)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Check for token on protected paths
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    log('Protected path detected');
    
    if (!token) {
      log('No auth token found, redirecting to login');
      // Redirect to login if no token found
      const url = new URL("/login", request.url);
      url.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(url);
    }
    
    // Validate token
    if (!isTokenValid(token)) {
      log('Invalid or expired token, redirecting to login');
      // Clear the invalid token
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
    
    log('Valid auth token found, allowing access to protected path');
  }

  // Check for admin access
  if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    log('Admin path detected');
    
    if (!token) {
      log('No auth token found, redirecting to login');
      const url = new URL("/login", request.url);
      url.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(url);
    }
    
    // Validate token
    if (!isTokenValid(token)) {
      log('Invalid or expired token, redirecting to login');
      // Clear the invalid token
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
    
    log('Valid auth token found, allowing access to admin path');
  }

  log('Request passed middleware checks');
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}; 