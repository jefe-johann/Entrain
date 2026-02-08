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
          select: { credits: true, email: true },
        });
        session.user.credits = dbUser?.credits ?? 0;
        session.user.isAdmin = dbUser?.email === "jlschumann@gmail.com";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Sync user to backend API when created
      if (user.email) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          });
          if (!response.ok) {
            console.error("Failed to sync user to backend:", response.status, response.statusText);
          }
        } catch (error) {
          console.error("Failed to sync user to backend:", error);
        } finally {
          clearTimeout(timeoutId);
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
      isAdmin: boolean;
    };
  }
}
