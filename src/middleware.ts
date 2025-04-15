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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for token on protected paths
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get("auth_token")?.value;
    
    if (!token) {
      // Redirect to login if no token found
      const url = new URL("/login", request.url);
      url.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Check for admin access
  if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    // Just redirect to dashboard if not authorized
    // The actual component will check for admin role
    const token = request.cookies.get("auth_token")?.value;
    
    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}; 