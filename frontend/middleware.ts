import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Allow only /login, /auth/access-denied, /auth/error and /api/auth/* as public routes
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/auth/access-denied" ||
    pathname === "/auth/error" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const hasUser = request.cookies.get("github_user");
  const hasToken = request.cookies.get("github_access_token");
  const hasSession = request.cookies.get("session_id");

  if (!hasUser || !hasToken || !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.png$|.*\\.mp4$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$|.*\\.gif$|.*\\.ico$).*)",
  ],
};
