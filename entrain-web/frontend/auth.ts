import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user id and credits to session
      if (session.user) {
        session.user.id = user.id;
        // Fetch credits from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
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
  pages: {
    signIn: "/",
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
