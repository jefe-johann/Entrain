import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Lightweight auth config for middleware (no Prisma/database imports)
// Uses JWT sessions so middleware and server components agree on session strategy
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
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
