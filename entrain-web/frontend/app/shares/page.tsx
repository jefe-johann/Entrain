import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Prisma, ReferralEventType } from "@prisma/client";
import { Header } from "@/components/Header";
import { ReferralLinkCard } from "@/components/ReferralLinkCard";
import {
  AdminReferralMetricsSection,
  type AdminReferralMetricsRow,
} from "@/components/AdminReferralMetricsSection";
import { ReferralMetricsSection } from "@/components/ReferralMetricsSection";
import { SocialShareCard } from "@/components/SocialShareCard";
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
  const attributedSignups = rewardedCount + pendingCount;

  let clickCount = 0;
  let uniqueClickCount = 0;
  let lifetimeRewardsGranted = rewardedCount;
  let reversedRewardsCount = 0;
  let adminRows: AdminReferralMetricsRow[] = [];

  try {
    const [totalClicks, uniqueClicksByIp, rewardsGranted, rewardsReversed] =
      await Promise.all([
        prisma.referralEvent.count({
          where: {
            referrerUserId: session.user.id,
            eventType: ReferralEventType.CLICK,
          },
        }),
        prisma.referralEvent.groupBy({
          by: ["ipHash"],
          where: {
            referrerUserId: session.user.id,
            eventType: ReferralEventType.CLICK,
            ipHash: { not: null },
          },
        }),
        prisma.referralEvent.count({
          where: {
            referrerUserId: session.user.id,
            eventType: ReferralEventType.REWARD_GRANTED,
          },
        }),
        prisma.referralEvent.count({
          where: {
            referrerUserId: session.user.id,
            eventType: ReferralEventType.REWARD_REVERSED,
          },
        }),
      ]);

    clickCount = totalClicks;
    uniqueClickCount = uniqueClicksByIp.length;
    lifetimeRewardsGranted = rewardsGranted;
    reversedRewardsCount = rewardsReversed;
  } catch (error) {
    // During rollout the new referral_events table may not exist yet.
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2021"
    ) {
      throw error;
    }
  }

  if (session.user.isAdmin) {
    const [signupRows, pendingRows, activeRows] = await Promise.all([
      prisma.referralSignup.groupBy({
        by: ["referrerUserId"],
        _count: { _all: true },
      }),
      prisma.referralSignup.groupBy({
        by: ["referrerUserId"],
        where: { rewardedAt: null },
        _count: { _all: true },
      }),
      prisma.referralSignup.groupBy({
        by: ["referrerUserId"],
        where: { rewardedAt: { not: null } },
        _count: { _all: true },
      }),
    ]);

    let clickRows: Array<{
      referrerUserId: string;
      _count: { _all: number };
    }> = [];
    let uniqueClickRows: Array<{
      referrerUserId: string;
      ipHash: string | null;
    }> = [];
    let rewardGrantedRows: Array<{
      referrerUserId: string;
      _count: { _all: number };
    }> = [];
    let rewardReversedRows: Array<{
      referrerUserId: string;
      _count: { _all: number };
    }> = [];

    try {
      [clickRows, uniqueClickRows, rewardGrantedRows, rewardReversedRows] =
        await Promise.all([
          prisma.referralEvent.groupBy({
            by: ["referrerUserId"],
            where: { eventType: ReferralEventType.CLICK },
            _count: { _all: true },
          }),
          prisma.referralEvent.groupBy({
            by: ["referrerUserId", "ipHash"],
            where: {
              eventType: ReferralEventType.CLICK,
              ipHash: { not: null },
            },
          }),
          prisma.referralEvent.groupBy({
            by: ["referrerUserId"],
            where: { eventType: ReferralEventType.REWARD_GRANTED },
            _count: { _all: true },
          }),
          prisma.referralEvent.groupBy({
            by: ["referrerUserId"],
            where: { eventType: ReferralEventType.REWARD_REVERSED },
            _count: { _all: true },
          }),
        ]);
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2021"
      ) {
        throw error;
      }
    }

    const rowMap = new Map<string, AdminReferralMetricsRow>();
    const ensureRow = (userId: string): AdminReferralMetricsRow => {
      const existing = rowMap.get(userId);
      if (existing) {
        return existing;
      }

      const row: AdminReferralMetricsRow = {
        userId,
        email: userId,
        clicks: 0,
        uniqueClickers: 0,
        attributedSignups: 0,
        pendingReferrals: 0,
        activeRewards: 0,
        rewardsGranted: 0,
        rewardsReversed: 0,
      };
      rowMap.set(userId, row);
      return row;
    };

    for (const row of signupRows) {
      ensureRow(row.referrerUserId).attributedSignups = row._count._all;
    }
    for (const row of pendingRows) {
      ensureRow(row.referrerUserId).pendingReferrals = row._count._all;
    }
    for (const row of activeRows) {
      ensureRow(row.referrerUserId).activeRewards = row._count._all;
    }
    for (const row of clickRows) {
      ensureRow(row.referrerUserId).clicks = row._count._all;
    }
    for (const row of uniqueClickRows) {
      ensureRow(row.referrerUserId).uniqueClickers += 1;
    }
    for (const row of rewardGrantedRows) {
      ensureRow(row.referrerUserId).rewardsGranted = row._count._all;
    }
    for (const row of rewardReversedRows) {
      ensureRow(row.referrerUserId).rewardsReversed = row._count._all;
    }

    const referrerIds = [...rowMap.keys()];
    const usersById = new Map<string, string>();
    if (referrerIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: referrerIds },
        },
        select: {
          id: true,
          email: true,
        },
      });

      for (const user of users) {
        usersById.set(user.id, user.email);
      }
    }

    adminRows = [...rowMap.values()]
      .map((row) => ({
        ...row,
        email: usersById.get(row.userId) ?? row.userId,
      }))
      .sort((a, b) => {
        if (b.rewardsGranted !== a.rewardsGranted) {
          return b.rewardsGranted - a.rewardsGranted;
        }
        if (b.attributedSignups !== a.attributedSignups) {
          return b.attributedSignups - a.attributedSignups;
        }
        return b.clicks - a.clicks;
      });
  }

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

            <ReferralMetricsSection
              clickCount={clickCount}
              uniqueClickCount={uniqueClickCount}
              attributedSignups={attributedSignups}
              lifetimeRewardsGranted={lifetimeRewardsGranted}
              reversedRewardsCount={reversedRewardsCount}
            />

            {session.user.isAdmin ? (
              <AdminReferralMetricsSection rows={adminRows} />
            ) : null}

            <SocialShareCard referralLink={referralLink} />
          </div>
        </main>
      </div>
    </div>
  );
}
