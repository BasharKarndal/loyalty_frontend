/** Default loyalty thresholds — used until settings API loads. */
export const LOYALTY_DEFAULTS = {
  visitRewardTarget: 10,
  pointsRewardTarget: 100,
  currency: 'د.ع',
  currencyPerPoint: 1000,
} as const;

export type LoyaltyValues = {
  visitRewardTarget: number;
  pointsRewardTarget: number;
  currency: string;
  currencyPerPoint: number;
};

export function pointsForPurchase(
  amount: number | string,
  currencyPerPoint = LOYALTY_DEFAULTS.currencyPerPoint
): number {
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(num) || num <= 0 || currencyPerPoint <= 0) return 0;
  return Math.max(0, Math.floor(num / currencyPerPoint));
}

export function loyaltyProgress(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(1, value / target);
}

export function loyaltyRemaining(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, target - value);
}

export function loyaltyEligible(value: number, target: number): boolean {
  return target > 0 && value >= target;
}

export function isEligibleForAny(
  visitCount: number,
  points: number,
  config: Pick<LoyaltyValues, 'visitRewardTarget' | 'pointsRewardTarget'> = LOYALTY_DEFAULTS
): boolean {
  return (
    loyaltyEligible(visitCount, config.visitRewardTarget) ||
    loyaltyEligible(points, config.pointsRewardTarget)
  );
}
