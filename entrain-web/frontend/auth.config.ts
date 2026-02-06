import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Lightweight auth config for middleware (no Prisma/database imports)
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/",
  },
} satisfies NextAuthConfig;
