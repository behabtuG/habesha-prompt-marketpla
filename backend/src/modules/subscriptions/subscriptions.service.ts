import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SubscriptionStatus,
  SubscribedUser,
  SubscriptionTier,
} from '../../common/types/subscription';

export const PLAN_CREDITS = {
  [SubscriptionTier.STARTER]: {
    Images: 5,
    Writing: 2,
    Business: 1,
    Other: 1,
  },
  [SubscriptionTier.PRO]: {
    Images: 10,
    'UI/UX': 5,
    Code: 3,
    Business: 3,
    Other: 2,
  },
  [SubscriptionTier.ULTIMATE]: {
    Images: 20,
    'UI/UX': 10,
    Code: 10,
    Business: 10,
    Writing: 10,
  },
};

export const PLAN_PRICES = {
  [SubscriptionTier.STARTER]: 10,
  [SubscriptionTier.PRO]: 50,
  [SubscriptionTier.ULTIMATE]: 100,
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSubscriptionStatus(userId: string) {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        categoryCredits: true,
      } as any,
    })) as unknown as SubscribedUser;

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if subscription has expired
    if (
      user.subscriptionStatus === SubscriptionStatus.ACTIVE &&
      user.subscriptionExpiresAt &&
      new Date() > user.subscriptionExpiresAt
    ) {
      // Auto-expire
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: SubscriptionStatus.EXPIRED,
          subscriptionTier: SubscriptionTier.FREE,
        } as any,
      });
      return {
        status: SubscriptionStatus.EXPIRED,
        tier: SubscriptionTier.FREE,
        expiresAt: user.subscriptionExpiresAt,
        credits: {},
      };
    }

    return {
      status: user.subscriptionStatus,
      tier: user.subscriptionTier,
      expiresAt: user.subscriptionExpiresAt,
      credits: user.categoryCredits || {},
    };
  }

  async activateSubscription(
    userId: string,
    tier: SubscriptionTier,
    days: number = 30,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Get credits for this tier
    const credits = PLAN_CREDITS[tier] || {};

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionTier: tier,
        subscriptionExpiresAt: expiresAt,
        categoryCredits: credits,
        lastCreditRefresh: new Date(),
      } as any,
    });

    this.logger.log(
      `Activated ${tier} subscription (${days} days) for user ${userId}`,
    );

    return {
      success: true,
      status: (user as any).subscriptionStatus,
      tier: (user as any).subscriptionTier,
      expiresAt: (user as any).subscriptionExpiresAt,
      credits: (user as any).categoryCredits,
    };
  }

  async cancelSubscription(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELLED,
      } as any,
    });

    return {
      success: true,
      status: SubscriptionStatus.CANCELLED,
    };
  }
}
