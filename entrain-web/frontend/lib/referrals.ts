import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NEW_SIGNUP_WINDOW_MS = 24 * 60 * 60 * 1000;

export function normalizeReferralCode(
  value: string | string[] | null | undefined
): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) {
    return null;
  }

  const trimmedValue = rawValue.trim();
  if (!UUID_PATTERN.test(trimmedValue)) {
    return null;
  }

  return trimmedValue.toLowerCase();
}

export function buildReferralLink(baseUrl: string, userId: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return `${normalizedBaseUrl}/?ref=${encodeURIComponent(userId)}`;
}

export async function captureReferralSignup({
  referredUserId,
  referrerUserId,
}: {
  referredUserId: string;
  referrerUserId: string;
}): Promise<void> {
  if (!referredUserId || !referrerUserId || referredUserId === referrerUserId) {
    return;
  }

  const existingAttribution = await prisma.referralSignup.findUnique({
    where: { referredUserId },
    select: { id: true },
  });
  if (existingAttribution) {
    return;
  }

  const [referredUser, referrerUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: referredUserId },
      select: { id: true, createdAt: true },
    }),
    prisma.user.findUnique({
      where: { id: referrerUserId },
      select: { id: true },
    }),
  ]);

  if (!referredUser || !referrerUser) {
    return;
  }

  if (Date.now() - referredUser.createdAt.getTime() > NEW_SIGNUP_WINDOW_MS) {
    return;
  }

  const completedPayments = await prisma.payment.count({
    where: {
      userId: referredUserId,
      status: "completed",
    },
  });
  if (completedPayments > 0) {
    return;
  }

  try {
    await prisma.referralSignup.create({
      data: {
        referrerUserId,
        referredUserId,
      },
    });
  } catch (error) {
    // Another request may attribute the same user concurrently.
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }
}
