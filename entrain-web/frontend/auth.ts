import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, persist user id to the JWT
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id and credits to session from JWT token
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // Fetch credits from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { credits: true },
        });
        session.user.credits = dbUser?.credits ?? 0;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Sync user to backend API when created
      if (user.email) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          });
        } catch (error) {
          console.error("Failed to sync user to backend:", error);
        }
      }
    },
  },
});

// Extend the session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      credits: number;
    };
  }
}
