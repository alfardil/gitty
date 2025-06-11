import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Allow only /login and /api/auth/* as public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const hasUser = request.cookies.get("github_user");
  const hasToken = request.cookies.get("github_access_token");

  if (!hasUser || !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for:
    // - api routes
    // - auth routes
    // - login page
    // - dashboard page
    // - static files
    // - root
    "/((?!api|auth|login|dashboard|_next|favicon.ico|$).*)",
  ],
};
