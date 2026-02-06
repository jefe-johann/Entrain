import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Use lightweight auth config (no Prisma) to stay under Edge Function size limit
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/generate/:path*", "/dashboard/:path*"],
};
