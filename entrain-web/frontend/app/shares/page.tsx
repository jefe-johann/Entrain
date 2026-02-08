import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { ReferralLinkCard } from "@/components/ReferralLinkCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Share2, Clock3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildReferralLink } from "@/lib/referrals";
import { getAppBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Earn Credits With Shares - Entrain",
  description:
    "Share your unique Entrain link and earn one credit when a new signup buys their first credit",
};

export default async function SharesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const [baseUrl, rewardedCount, pendingCount] = await Promise.all([
    getAppBaseUrl(),
    prisma.referralSignup.count({
      where: {
        referrerUserId: session.user.id,
        rewardedAt: { not: null },
      },
    }),
    prisma.referralSignup.count({
      where: {
        referrerUserId: session.user.id,
        rewardedAt: null,
      },
    }),
  ]);

  const referralLink = buildReferralLink(baseUrl, session.user.id);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50/50 via-background to-indigo-50/30 pointer-events-none" />

      <div className="relative z-10">
        <Header credits={session.user.credits} isAdmin={session.user.isAdmin} />

        <main id="main-content" className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md shadow-purple-500/20">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Earn Credits With Shares</h1>
                <p className="text-sm text-muted-foreground">
                  Share your link. If a new user signs up and buys their first credit, you earn 1 credit.
                </p>
              </div>
            </div>

            <ReferralLinkCard referralLink={referralLink} />

            <p className="text-sm text-muted-foreground">
              Note: if a referred user later receives a refund or opens a payment dispute, the referral credit is removed.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-600" />
                    Credits earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{rewardedCount}</p>
                  <p className="text-sm text-muted-foreground">
                    One credit per qualified referral.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-violet-600" />
                    Pending referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">
                    Signed up, but no paid credit purchase yet.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
