import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CreditPackSelector } from "@/components/CreditPackSelector";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coins, Share2 } from "lucide-react";
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
                  {session.user.email} &middot;{" "}
                  {session.user.isAdmin
                    ? "unlimited"
                    : session.user.credits}{" "}
                  credit
                  {session.user.credits !== 1 ? "s" : ""} remaining
                </p>
              </div>
            </div>

            <CreditPackSelector userEmail={session.user.email!} />

            <section className="mt-8">
              <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-blue-50 to-teal-50 shadow-md">
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl" />
                <div className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-teal-200/30 blur-2xl" />

                <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Want free credits?
                    </p>
                    <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                      <Share2 className="h-5 w-5 text-slate-500" />
                      Earn credits by sharing Entrain
                    </h2>
                    <p className="mt-2 max-w-xl text-sm text-slate-600">
                      Share your referral link. When a new user signs up and
                      buys their first credit, you get 1 credit.
                    </p>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full sm:w-auto whitespace-nowrap border-slate-300 bg-white/90 font-semibold text-slate-700 hover:bg-white hover:text-slate-900"
                  >
                    <Link href="/shares">
                      Go to Earn Credits
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
