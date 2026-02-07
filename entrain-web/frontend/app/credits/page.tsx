import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { CreditPackSelector } from "@/components/CreditPackSelector";
import { Coins } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Credits - Entrain",
  description:
    "Purchase credits to generate more meditation tracks with binaural beats",
};

export default async function CreditsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50/50 via-background to-indigo-50/30 pointer-events-none" />

      <div className="relative z-10">
        <Header credits={session.user.credits} isAdmin={session.user.isAdmin} />

        <main id="main-content" className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md shadow-purple-500/20">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Buy Credits</h1>
                <p className="text-muted-foreground text-sm">
                  You have{" "}
                  {session.user.isAdmin
                    ? "unlimited"
                    : session.user.credits}{" "}
                  credit
                  {session.user.credits !== 1 ? "s" : ""} remaining
                </p>
              </div>
            </div>

            <CreditPackSelector userEmail={session.user.email!} />
          </div>
        </main>
      </div>
    </div>
  );
}
