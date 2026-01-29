import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/generate") ||
    req.nextUrl.pathname.startsWith("/dashboard");

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/generate/:path*", "/dashboard/:path*"],
};
