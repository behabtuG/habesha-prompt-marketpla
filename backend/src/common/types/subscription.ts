// src/common/types/subscription.ts
export enum SubscriptionStatus {
  FREE = 'FREE',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ULTIMATE = 'ULTIMATE',
}

export interface SubscribedUser {
  subscriptionStatus: string;
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  categoryCredits?: any;
}
