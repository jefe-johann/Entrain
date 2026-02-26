import "server-only";

import { createHash } from "crypto";
import { Prisma, ReferralEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NEW_SIGNUP_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_HEADER_VALUE_LENGTH = 500;

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

function truncateNullableString(
  value: string | null | undefined,
  maxLength = MAX_HEADER_VALUE_LENGTH
): string | null {
  if (!value) {
    return null;
  }
  return value.slice(0, maxLength);
}

function hashSensitiveValue(value: string): string {
  const salt = process.env.REFERRAL_ANALYTICS_SALT ?? "entrain-referrals";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export async function captureReferralClick({
  referrerUserId,
  landingPath,
  userAgent,
  referer,
  ipAddress,
}: {
  referrerUserId: string;
  landingPath: string;
  userAgent?: string | null;
  referer?: string | null;
  ipAddress?: string | null;
}): Promise<void> {
  if (!referrerUserId) {
    return;
  }

  const referrerExists = await prisma.user.findUnique({
    where: { id: referrerUserId },
    select: { id: true },
  });
  if (!referrerExists) {
    return;
  }

  await prisma.referralEvent.create({
    data: {
      eventType: ReferralEventType.CLICK,
      referrerUserId,
      landingPath: truncateNullableString(landingPath, 255),
      userAgent: truncateNullableString(userAgent),
      referer: truncateNullableString(referer),
      ipHash: ipAddress ? hashSensitiveValue(ipAddress.trim()) : null,
    },
  });
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
    await prisma.$transaction(async (tx) => {
      await tx.referralSignup.create({
        data: {
          referrerUserId,
          referredUserId,
        },
      });

      await tx.referralEvent.create({
        data: {
          eventType: ReferralEventType.SIGNUP_ATTRIBUTED,
          referrerUserId,
          referredUserId,
        },
      });
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
